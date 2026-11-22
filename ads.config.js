// Merkezi AdMob Reklam Yapılandırması (Android & iOS)
// Canlı yayına geçerken USE_TEST_ADS = false yapıp PRODUCTION_AD_UNITS ve app.json içindeki App ID'leri doldurun.

export const USE_TEST_ADS = true;

export const TEST_AD_UNITS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

export const PRODUCTION_AD_UNITS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

export const AD_POLICY_CONFIG = {
  onboardingFreeRounds: 2, // İlk 2 tamamlanan dalgada geçiş reklamı gösterilmez
  minRoundsBetweenInterstitial: 3, // Sonrasında en az 3 dalga/oyun sonu tamamlanmalı
  minCooldownMs: 3 * 60 * 1000, // VE en az 3 dakika geçmiş olmalı
};

export function getAdUnitId(platform, type) {
  const os = platform === 'ios' ? 'ios' : 'android';
  const source = (__DEV__ || USE_TEST_ADS) ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
  return source[os][type];
}
