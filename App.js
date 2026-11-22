import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, StatusBar, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import mobileAds, { AdEventType, AdsConsent, BannerAd, BannerAdSize, InterstitialAd, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'react-native-iap';
import gameHtml from './generated/game-html';
import { AD_POLICY_CONFIG, getAdUnitId } from './ads.config';
import { createAdPolicy } from './adPolicy';
import { IAP_PRODUCTS, IAP_SKUS, findIapProductById } from './iap.config';

const AD_FREE_KEY = 'satranc2_ad_free_v1';
const PROCESSED_TX_KEY = 'satranc2_processed_tx_v1';
const IAP_WATCHDOG_MS = 20000;

const source = {
  html: gameHtml,
  baseUrl: 'https://satranc2.invalid/',
};

const BANNER_UNIT_ID = getAdUnitId(Platform.OS, 'banner');
const INTERSTITIAL_UNIT_ID = getAdUnitId(Platform.OS, 'interstitial');
const REWARDED_UNIT_ID = getAdUnitId(Platform.OS, 'rewarded');

function isPurchasedState(purchase) {
  return (!purchase?.purchaseState || purchase.purchaseState === 'purchased') && !purchase?.revocationDateIOS;
}

function getTxKey(purchase, sku) {
  return purchase?.id || purchase?.purchaseToken || `${sku}:${purchase?.transactionDate || ''}`;
}

export default function App() {
  const webViewRef = useRef(null);
  const webViewLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const adPolicyRef = useRef(createAdPolicy(AD_POLICY_CONFIG));
  const interstitialRef = useRef(null);
  const interstitialCleanupRef = useRef(null);
  const interstitialLoadingRef = useRef(false);
  const interstitialLoadedRef = useRef(false);
  const interstitialShowingRef = useRef(false);
  const rewardedRef = useRef(null);
  const rewardedCleanupRef = useRef(null);
  const rewardedLoadingRef = useRef(false);
  const rewardedLoadedRef = useRef(false);
  const rewardedShowingRef = useRef(false);
  const rewardedPendingTypeRef = useRef(null);
  const rewardedEarnedRef = useRef(false);
  const adsInitStartedRef = useRef(false);
  const adsInitializedRef = useRef(false);
  const privacyOptionsRequiredRef = useRef(false);

  const iapReadyRef = useRef(false);
  const iapInitPromiseRef = useRef(null);
  const iapListenersAttachedRef = useRef(false);
  const iapUpdateSubRef = useRef(null);
  const iapErrorSubRef = useRef(null);
  const iapBusyRef = useRef(false);
  const iapWatchdogRef = useRef(null);
  const iapPricesRef = useRef({});
  const adFreeRef = useRef(false);
  const processedTxRef = useRef(new Set());
  const pendingConsumablesRef = useRef([]);

  const [adFree, setAdFree] = useState(false);
  const [adsReady, setAdsReady] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);

  const clearIapWatchdog = useCallback(() => {
    if (iapWatchdogRef.current) {
      clearTimeout(iapWatchdogRef.current);
      iapWatchdogRef.current = null;
    }
  }, []);

  const pushIapStateToWebView = useCallback((overrides = {}) => {
    const payload = {
      adFree: typeof overrides.adFree === 'boolean' ? overrides.adFree : adFreeRef.current,
      busy: typeof overrides.busy === 'boolean' ? overrides.busy : iapBusyRef.current,
      prices: overrides.prices || iapPricesRef.current,
    };
    if (typeof overrides.message === 'string') {
      payload.message = overrides.message;
    }
    const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
    webViewRef.current?.injectJavaScript(`if (typeof window.__onNativeIapState === 'function') window.__onNativeIapState(${serialized}); true;`);
  }, []);

  const grantSoulGemsToWebView = useCallback((amount, label) => {
    const safeLabel = JSON.stringify(label || '').replace(/</g, '\\u003c');
    webViewRef.current?.injectJavaScript(`if (typeof window.__onNativeSoulGemGrant === 'function') window.__onNativeSoulGemGrant(${Number(amount) || 0}, ${safeLabel}); true;`);
  }, []);

  const setAudioPaused = useCallback((paused) => {
    webViewRef.current?.injectJavaScript(`
      (function(){
        try {
          window.__nativePaused = ${paused ? 'true' : 'false'};
          if (window.game) {
            if (typeof window.game.syncAmbientMusic === 'function') window.game.syncAmbientMusic();
            if (window.game.audioCtx) {
              if (${paused ? 'true' : 'false'}) {
                if (window.game.audioCtx.state === 'running') window.game.audioCtx.suspend().catch(function(){});
              } else if (window.game.audioCtx.state === 'suspended' && window.game.soundEnabled) {
                window.game.audioCtx.resume().catch(function(){});
              }
            }
          }
        } catch (e) {}
      })();
      true;
    `);
  }, []);

  const cleanupInterstitial = useCallback(() => {
    if (interstitialCleanupRef.current) {
      interstitialCleanupRef.current();
      interstitialCleanupRef.current = null;
    }
  }, []);

  const preloadInterstitial = useCallback(() => {
    if (adFreeRef.current || !adsInitializedRef.current) return;
    if (interstitialShowingRef.current || interstitialLoadingRef.current || interstitialLoadedRef.current) return;
    cleanupInterstitial();
    interstitialLoadingRef.current = true;
    interstitialLoadedRef.current = false;

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadingRef.current = false;
      interstitialLoadedRef.current = true;
    });
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      interstitialShowingRef.current = true;
      interstitialLoadedRef.current = false;
      adPolicyRef.current.markShown();
      setAudioPaused(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialShowingRef.current = false;
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      setAudioPaused(false);
      cleanupInterstitial();
      preloadInterstitial();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialShowingRef.current = false;
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      cleanupInterstitial();
    });

    interstitialCleanupRef.current = () => {
      unsubLoaded();
      unsubOpened();
      unsubClosed();
      unsubError();
    };
    interstitialRef.current = ad;
    ad.load();
  }, [cleanupInterstitial, setAudioPaused]);

  const cleanupRewarded = useCallback(() => {
    if (rewardedCleanupRef.current) {
      rewardedCleanupRef.current();
      rewardedCleanupRef.current = null;
    }
    rewardedRef.current = null;
  }, []);

  const notifyRewardFailed = useCallback((msg) => {
    const safe = JSON.stringify(msg || 'Video şu an hazır değil.').replace(/</g, '\\u003c');
    webViewRef.current?.injectJavaScript(`if (typeof window.__onNativeRewardFailed === 'function') window.__onNativeRewardFailed(${safe}); true;`);
  }, []);

  const preloadRewarded = useCallback(() => {
    if (!adsInitializedRef.current || rewardedLoadingRef.current || rewardedLoadedRef.current || rewardedShowingRef.current) return;
    cleanupRewarded();
    rewardedLoadingRef.current = true;
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, { requestNonPersonalizedAdsOnly: true });
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoadingRef.current = false;
      rewardedLoadedRef.current = true;
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedEarnedRef.current = true;
    });
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      rewardedShowingRef.current = true;
      setAudioPaused(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedShowingRef.current = false;
      rewardedLoadedRef.current = false;
      setAudioPaused(false);
      const earned = rewardedEarnedRef.current;
      const pendingType = rewardedPendingTypeRef.current;
      rewardedEarnedRef.current = false;
      rewardedPendingTypeRef.current = null;
      if (earned && pendingType) {
        const safeType = JSON.stringify(pendingType).replace(/</g, '\\u003c');
        webViewRef.current?.injectJavaScript(`if (typeof window.__onNativeRewardEarned === 'function') window.__onNativeRewardEarned(${safeType}); true;`);
      } else if (pendingType) {
        notifyRewardFailed('Ödül için videoyu sonuna kadar izlemelisin.');
      }
      cleanupRewarded();
      setTimeout(() => { if (mountedRef.current) preloadRewarded(); }, 1000);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      const pendingType = rewardedPendingTypeRef.current;
      rewardedLoadingRef.current = false;
      rewardedLoadedRef.current = false;
      rewardedShowingRef.current = false;
      rewardedEarnedRef.current = false;
      rewardedPendingTypeRef.current = null;
      setAudioPaused(false);
      if (pendingType) {
        notifyRewardFailed('Video şu an gösterilemedi.');
      }
      cleanupRewarded();
    });
    rewardedCleanupRef.current = () => {
      unsubLoaded();
      unsubEarned();
      unsubOpened();
      unsubClosed();
      unsubError();
    };
    rewardedRef.current = ad;
    ad.load();
  }, [cleanupRewarded, notifyRewardFailed, setAudioPaused]);

  const tryShowRewarded = useCallback(async (rewardType) => {
    if (rewardedShowingRef.current) return;
    if (!adsInitializedRef.current) {
      try {
        await mobileAds().initialize();
        adsInitializedRef.current = true;
      } catch {}
    }
    if (!rewardedLoadedRef.current || !rewardedRef.current) {
      preloadRewarded();
      notifyRewardFailed('Video hazırlanıyor, birkaç saniye sonra tekrar dene.');
      return;
    }
    rewardedPendingTypeRef.current = rewardType;
    rewardedEarnedRef.current = false;
    try {
      await rewardedRef.current.show();
    } catch {
      rewardedPendingTypeRef.current = null;
      rewardedLoadedRef.current = false;
      rewardedShowingRef.current = false;
      setAudioPaused(false);
      notifyRewardFailed('Video şu an gösterilemedi.');
      preloadRewarded();
    }
  }, [notifyRewardFailed, preloadRewarded, setAudioPaused]);

  const pushPrivacyStateToWebView = useCallback((required) => {
    if (typeof required === 'boolean') {
      privacyOptionsRequiredRef.current = required;
    }
    if (!webViewLoadedRef.current || !webViewRef.current) return;
    const payload = JSON.stringify({ required: !!privacyOptionsRequiredRef.current });
    webViewRef.current.injectJavaScript(
      `if (typeof window.__onNativePrivacyState === 'function') window.__onNativePrivacyState(${payload}); true;`
    );
  }, []);

  const openPrivacyOptionsForm = useCallback(async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
      const updated = await AdsConsent.requestInfoUpdate().catch(() => null);
      if (updated) {
        pushPrivacyStateToWebView(updated.privacyOptionsRequirementStatus === 'REQUIRED');
      }
    } catch {}
  }, [pushPrivacyStateToWebView]);

  const initAdsIfNeeded = useCallback(async () => {
    if (adFreeRef.current) return;
    if (adsInitializedRef.current) {
      if (mountedRef.current) {
        setAdsReady(true);
        setBannerKey(k => k + 1);
      }
      preloadInterstitial();
      preloadRewarded();
      return;
    }
    if (adsInitStartedRef.current) return;
    adsInitStartedRef.current = true;
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate().catch(() => null);
      const afterForm = await AdsConsent.loadAndShowConsentFormIfRequired().catch(() => consentInfo);
      const finalInfo = afterForm || consentInfo;
      pushPrivacyStateToWebView(finalInfo?.privacyOptionsRequirementStatus === 'REQUIRED');
      await mobileAds().initialize();
      adsInitializedRef.current = true;
      if (!mountedRef.current || adFreeRef.current) return;
      setAdsReady(true);
      preloadInterstitial();
      preloadRewarded();
    } catch {
      adsInitStartedRef.current = false;
    }
  }, [preloadInterstitial, preloadRewarded, pushPrivacyStateToWebView]);

  const persistAdFree = useCallback(async (enabled) => {
    adFreeRef.current = enabled;
    if (mountedRef.current) setAdFree(enabled);
    if (enabled) {
      cleanupInterstitial();
      interstitialLoadedRef.current = false;
      interstitialLoadingRef.current = false;
      if (mountedRef.current) setBannerLoaded(false);
    } else {
      void initAdsIfNeeded();
    }
    try { await AsyncStorage.setItem(AD_FREE_KEY, enabled ? '1' : '0'); } catch {}
    pushIapStateToWebView({ adFree: enabled });
  }, [cleanupInterstitial, initAdsIfNeeded, pushIapStateToWebView]);

  const recordProcessedTx = useCallback(async (txKey) => {
    if (!txKey) return;
    processedTxRef.current.add(txKey);
    const list = Array.from(processedTxRef.current).slice(-200);
    processedTxRef.current = new Set(list);
    try { await AsyncStorage.setItem(PROCESSED_TX_KEY, JSON.stringify(list)); } catch {}
  }, []);

  const deliverConsumablePurchase = useCallback(async (purchase, product) => {
    const txKey = getTxKey(purchase, product.id);
    if (!webViewLoadedRef.current || !webViewRef.current) {
      if (!pendingConsumablesRef.current.some(item => getTxKey(item.purchase, item.product.id) === txKey)) {
        pendingConsumablesRef.current.push({ purchase, product });
      }
      pushIapStateToWebView({ busy: false });
      return false;
    }
    let granted = false;
    if (!processedTxRef.current.has(txKey)) {
      await recordProcessedTx(txKey);
      grantSoulGemsToWebView(product.soulGemsAmount, product.title);
      pushIapStateToWebView({ busy: false, message: `💎 +${product.soulGemsAmount} Ruh Taşı hesabına eklendi! (${product.title})` });
      granted = true;
    } else {
      pushIapStateToWebView({ busy: false, message: '' });
    }
    try {
      await finishTransaction({ purchase, isConsumable: true });
    } catch {}
    return granted;
  }, [grantSoulGemsToWebView, pushIapStateToWebView, recordProcessedTx]);

  const flushPendingConsumables = useCallback(async () => {
    if (!webViewLoadedRef.current || !webViewRef.current || pendingConsumablesRef.current.length === 0) return;
    const queue = pendingConsumablesRef.current.splice(0);
    for (const item of queue) {
      await deliverConsumablePurchase(item.purchase, item.product);
    }
  }, [deliverConsumablePurchase]);

  const processPurchase = useCallback(async (purchase) => {
    clearIapWatchdog();
    const sku = purchase?.productId;
    const product = findIapProductById(sku);
    if (!product) {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    if (purchase?.revocationDateIOS) {
      iapBusyRef.current = false;
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        await persistAdFree(false);
      }
      try { await finishTransaction({ purchase, isConsumable: product.isConsumable }); } catch {}
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    if (purchase.purchaseState === 'pending') {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: 'Ödeme onayı bekleniyor. Onaylandığında otomatik olarak hesabına eklenecek.' });
      return;
    }
    if (!isPurchasedState(purchase)) {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: '' });
      return;
    }

    try {
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        await persistAdFree(true);
        if (purchase.isAcknowledgedAndroid !== true) {
          try { await finishTransaction({ purchase, isConsumable: false }); } catch {}
        }
        iapBusyRef.current = false;
        pushIapStateToWebView({ adFree: true, busy: false, message: '✅ Reklamlar kalıcı olarak kaldırıldı!' });
      } else if (product.soulGemsAmount > 0) {
        iapBusyRef.current = false;
        await deliverConsumablePurchase(purchase, product);
      }
    } catch {
      iapBusyRef.current = false;
      pushIapStateToWebView({ busy: false, message: 'Satın alma işlenirken sorun oluştu. Lütfen tekrar dene.' });
    }
  }, [clearIapWatchdog, deliverConsumablePurchase, persistAdFree, pushIapStateToWebView]);

  const reconcilePurchases = useCallback(async () => {
    if (!iapReadyRef.current) return { ok: false, ownsAdFree: adFreeRef.current, recoveredGems: 0 };
    const existing = await getAvailablePurchases();
    if (!Array.isArray(existing)) return { ok: false, ownsAdFree: adFreeRef.current, recoveredGems: 0 };

    let ownsAdFree = false;
    let recoveredGems = 0;

    for (const purchase of existing) {
      if (!isPurchasedState(purchase)) continue;
      const product = findIapProductById(purchase.productId);
      if (!product) continue;
      if (product.id === IAP_PRODUCTS.remove_ads.id) {
        ownsAdFree = true;
        if (purchase.isAcknowledgedAndroid !== true) {
          try { await finishTransaction({ purchase, isConsumable: false }); } catch {}
        }
      } else if (product.soulGemsAmount > 0) {
        const granted = await deliverConsumablePurchase(purchase, product);
        if (granted) recoveredGems += product.soulGemsAmount;
      }
    }

    if (ownsAdFree !== adFreeRef.current) {
      await persistAdFree(ownsAdFree);
    }
    return { ok: true, ownsAdFree, recoveredGems };
  }, [deliverConsumablePurchase, persistAdFree]);

  const ensureIapReady = useCallback(async () => {
    if (iapReadyRef.current) {
      if (Object.keys(iapPricesRef.current).length < IAP_SKUS.length) {
        const products = await fetchProducts({ skus: IAP_SKUS, type: 'in-app' }).catch(() => []);
        if (mountedRef.current && Array.isArray(products) && products.length > 0) {
          const prices = { ...iapPricesRef.current };
          products.forEach((p) => {
            const id = p.id || p.productId;
            if (id && p.displayPrice) prices[id] = p.displayPrice;
          });
          iapPricesRef.current = prices;
          pushIapStateToWebView({ prices });
        }
      }
      return true;
    }
    if (iapInitPromiseRef.current) return iapInitPromiseRef.current;

    iapInitPromiseRef.current = (async () => {
      try {
        const connected = await initConnection();
        if (!mountedRef.current || !connected) return false;
        iapReadyRef.current = true;

        if (!iapListenersAttachedRef.current) {
          iapListenersAttachedRef.current = true;
          iapUpdateSubRef.current = purchaseUpdatedListener((purchase) => {
            void processPurchase(purchase);
          });
          iapErrorSubRef.current = purchaseErrorListener((err) => {
            clearIapWatchdog();
            iapBusyRef.current = false;
            const msg = isUserCancelledError(err)
              ? 'Satın alma iptal edildi.'
              : 'Mağaza işlemi tamamlanamadı. Lütfen tekrar dene.';
            pushIapStateToWebView({ busy: false, message: msg });
          });
        }

        const products = await fetchProducts({ skus: IAP_SKUS, type: 'in-app' }).catch(() => []);
        if (mountedRef.current && Array.isArray(products)) {
          const prices = { ...iapPricesRef.current };
          products.forEach((p) => {
            const id = p.id || p.productId;
            if (id && p.displayPrice) prices[id] = p.displayPrice;
          });
          iapPricesRef.current = prices;
          pushIapStateToWebView({ prices });
        }

        await reconcilePurchases().catch(() => {});
        return true;
      } catch {
        return false;
      } finally {
        iapInitPromiseRef.current = null;
      }
    })();

    return iapInitPromiseRef.current;
  }, [clearIapWatchdog, processPurchase, pushIapStateToWebView, reconcilePurchases]);

  const tryShowInterstitial = useCallback(() => {
    if (adFreeRef.current || !adsReady || interstitialShowingRef.current || rewardedShowingRef.current) return;
    if (!adPolicyRef.current.isEligible()) return;
    if (!interstitialLoadedRef.current || !interstitialRef.current) {
      preloadInterstitial();
      return;
    }
    interstitialLoadedRef.current = false;
    Promise.resolve(interstitialRef.current.show()).catch(() => {
      interstitialShowingRef.current = false;
      cleanupInterstitial();
      preloadInterstitial();
    });
  }, [adsReady, cleanupInterstitial, preloadInterstitial]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const storedAdFree = await AsyncStorage.getItem(AD_FREE_KEY);
        if (!mountedRef.current) return;
        if (storedAdFree === '1') {
          adFreeRef.current = true;
          setAdFree(true);
          pushIapStateToWebView({ adFree: true });
          return;
        }
        await initAdsIfNeeded();
      } catch {}
    })();
    return () => {
      mountedRef.current = false;
      cleanupInterstitial();
      cleanupRewarded();
    };
  }, [cleanupInterstitial, cleanupRewarded, initAdsIfNeeded, pushIapStateToWebView]);

  useEffect(() => {
    (async () => {
      try {
        const rawTx = await AsyncStorage.getItem(PROCESSED_TX_KEY);
        if (rawTx) {
          const parsed = JSON.parse(rawTx);
          if (Array.isArray(parsed)) processedTxRef.current = new Set(parsed);
        }
      } catch {}
      await ensureIapReady();
    })();

    return () => {
      clearIapWatchdog();
      iapUpdateSubRef.current?.remove?.();
      iapErrorSubRef.current?.remove?.();
      iapListenersAttachedRef.current = false;
      iapReadyRef.current = false;
      endConnection().catch(() => {});
    };
  }, [clearIapWatchdog, ensureIapReady]);

  const handleIapAction = useCallback(async (action, productId) => {
    if (iapBusyRef.current) return;
    const ready = await ensureIapReady();
    if (!ready) {
      pushIapStateToWebView({ busy: false, message: 'Mağaza şu anda kullanılamıyor. İnternet bağlantını kontrol et.' });
      return;
    }

    if (action === 'restore') {
      iapBusyRef.current = true;
      pushIapStateToWebView({ busy: true, message: 'Satın alımlar kontrol ediliyor…' });
      try {
        if (Platform.OS === 'ios') {
          await restorePurchases();
        }
        const res = await reconcilePurchases();
        if (res.ownsAdFree && res.recoveredGems > 0) {
          pushIapStateToWebView({ adFree: true, busy: false, message: `✅ Reklamsız sürüm ve +${res.recoveredGems} 💎 geri yüklendi!` });
        } else if (res.ownsAdFree) {
          pushIapStateToWebView({ adFree: true, busy: false, message: '✅ Reklamsız sürüm geri yüklendi!' });
        } else if (res.recoveredGems > 0) {
          pushIapStateToWebView({ busy: false, message: `✅ +${res.recoveredGems} 💎 hesabına geri yüklendi!` });
        } else {
          pushIapStateToWebView({ busy: false, message: 'Geri yüklenecek satın alım bulunamadı.' });
        }
      } catch {
        pushIapStateToWebView({ busy: false, message: 'Satın alımlar geri yüklenemedi. Tekrar dene.' });
      } finally {
        iapBusyRef.current = false;
      }
      return;
    }

    if (action === 'purchase') {
      const product = findIapProductById(productId);
      if (!product) return;
      if (product.id === IAP_PRODUCTS.remove_ads.id && adFreeRef.current) return;

      iapBusyRef.current = true;
      pushIapStateToWebView({ busy: true, message: 'Mağaza açılıyor…' });
      clearIapWatchdog();
      iapWatchdogRef.current = setTimeout(() => {
        if (!iapBusyRef.current) return;
        iapBusyRef.current = false;
        pushIapStateToWebView({ busy: false, message: '' });
        void reconcilePurchases().catch(() => {});
      }, IAP_WATCHDOG_MS);

      try {
        await requestPurchase({
          type: 'in-app',
          request: {
            apple: { sku: product.id },
            google: { skus: [product.id] },
          },
        });
      } catch (err) {
        clearIapWatchdog();
        iapBusyRef.current = false;
        const msg = isUserCancelledError(err)
          ? 'Satın alma iptal edildi.'
          : 'Satın alma başlatılamadı. Lütfen tekrar dene.';
        pushIapStateToWebView({ busy: false, message: msg });
      }
    }
  }, [clearIapWatchdog, ensureIapReady, pushIapStateToWebView, reconcilePurchases]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        webViewRef.current?.injectJavaScript(`
          (function(){
            try {
              window.__nativePaused = true;
              if (window.game) {
                if (window.game.phase === 'PLAYER' || window.game.phase === 'HQ') {
                  window.game.saveActiveRunState();
                }
                if (typeof window.game.syncAmbientMusic === 'function') {
                  window.game.syncAmbientMusic();
                }
                if (window.game.audioCtx && window.game.audioCtx.state === 'running') {
                  window.game.audioCtx.suspend().catch(function(){});
                }
              }
            } catch (e) {}
          })();
          true;
        `);
      } else if (nextState === 'active') {
        if (adsReady && !adFreeRef.current) {
          if (!bannerLoaded) setBannerKey(k => k + 1);
          preloadInterstitial();
        }
        if (!interstitialShowingRef.current && !rewardedShowingRef.current) {
          setAudioPaused(false);
        }
        void ensureIapReady().then(ready => {
          if (ready && !iapBusyRef.current) return reconcilePurchases();
        }).catch(() => {});
      }
    });

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (interstitialShowingRef.current || rewardedShowingRef.current) return true;
      webViewRef.current?.injectJavaScript(`
        (function(){
          try {
            var closeable = ['privacy-modal', 'lang-modal', 'guide-modal', 'shop-modal', 'rules-modal', 'codex-modal', 'talent-modal', 'promotion-modal'];
            for (var i = 0; i < closeable.length; i++) {
              var el = document.getElementById(closeable[i]);
              if (el && !el.classList.contains('hidden')) {
                el.classList.add('hidden');
                return;
              }
            }
            var goModal = document.getElementById('gameover-modal');
            if (goModal && !goModal.classList.contains('hidden')) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('EXIT_APP');
              }
              return;
            }
            var splash = document.getElementById('splash-screen');
            if (splash && splash.classList.contains('hidden') && window.game && typeof window.game.openSplashMenu === 'function') {
              window.game.openSplashMenu();
              return;
            }
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('EXIT_APP');
            }
          } catch (e) {}
        })();
        true;
      `);
      return true;
    });

    return () => {
      appStateSub.remove();
      backSub.remove();
    };
  }, [adsReady, bannerLoaded, ensureIapReady, preloadInterstitial, reconcilePurchases, setAudioPaused]);

  const handleMessage = useCallback((event) => {
    const raw = event.nativeEvent.data;
    if (raw === 'EXIT_APP') {
      BackHandler.exitApp();
      return;
    }
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'ad_event') {
        if (msg.event === 'round_completed') {
          adPolicyRef.current.recordRound();
        } else if (msg.event === 'natural_break') {
          tryShowInterstitial();
        }
      } else if (msg.type === 'rewarded_ad') {
        void tryShowRewarded(msg.rewardType);
      } else if (msg.type === 'haptic') {
        try {
          if (msg.style === 'success') {
            Vibration.vibrate(Platform.OS === 'android' ? [0, 18, 35, 24] : 20);
          } else if (msg.style === 'error') {
            Vibration.vibrate(Platform.OS === 'android' ? [0, 45, 35, 45] : 40);
          } else if (msg.style === 'medium') {
            Vibration.vibrate(18);
          } else {
            Vibration.vibrate(10);
          }
        } catch {}
      } else if (msg.type === 'iap') {
        void handleIapAction(msg.action, msg.productId);
      } else if (msg.type === 'privacy_options') {
        void openPrivacyOptionsForm();
      } else if (msg.type === 'feedback') {
        Linking.openURL('mailto:pikserax@gmail.com?subject=Satranc%202%20Geri%20Bildirim').catch(() => {});
      }
    } catch {}
  }, [handleIapAction, openPrivacyOptionsForm, tryShowInterstitial, tryShowRewarded]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={source}
            originWhitelist={['*']}
            style={styles.screen}
            javaScriptEnabled
            domStorageEnabled
            androidLayerType="hardware"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => {
              webViewLoadedRef.current = true;
              pushIapStateToWebView();
              pushPrivacyStateToWebView();
              void flushPendingConsumables();
            }}
            onMessage={handleMessage}
          />
          {adsReady && !adFree && (
            <View style={bannerLoaded ? styles.bannerBox : styles.bannerHidden}>
              <BannerAd
                key={bannerKey}
                unitId={BANNER_UNIT_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                onAdLoaded={() => setBannerLoaded(true)}
                onAdFailedToLoad={() => setBannerLoaded(false)}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1, backgroundColor: '#020617' },
  bannerBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: '#1e293b' },
  bannerHidden: { height: 0, overflow: 'hidden' },
});
