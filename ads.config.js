// Merkezi AdMob Reklam Yapılandırması (Android & iOS)
// Canlı yayına geçerken USE_TEST_ADS = false yapıp PRODUCTION_AD_UNITS ve app.json içindeki App ID'leri doldurun.

export const USE_TEST_ADS = false;

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
    banner: 'ca-app-pub-5635814061302700/5488049136',
    interstitial: 'ca-app-pub-5635814061302700/3540542648',
    rewarded: 'ca-app-pub-5635814061302700/6170575419',
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
  minCooldownMs: 5 * 60 * 1000, // VE en az 5 dakika geçmiş olmalı (İki Kalp, Bir Deste ile eşit)
};

export function getAdUnitId(platform, type) {
  const os = platform === 'ios' ? 'ios' : 'android';
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const source = (isDev || USE_TEST_ADS) ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
  return source[os][type];
}
