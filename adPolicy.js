// Geçiş reklamı sıklık kuralı (ilk 2 dalga yok; sonrası >= 3 dalga VE >= 3 dakika).
const DEFAULT_CONFIG = {
  onboardingFreeRounds: 2,
  minRoundsBetweenInterstitial: 3,
  minCooldownMs: 3 * 60 * 1000,
};

function createAdPolicy(config = {}, now = () => Date.now()) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let totalCompleted = 0;
  let roundsSinceLastAd = 0;
  let lastShownAt = null;

  return {
    recordRound() {
      totalCompleted += 1;
      roundsSinceLastAd += 1;
    },
    isEligible() {
      if (totalCompleted <= cfg.onboardingFreeRounds) return false;
      if (roundsSinceLastAd < cfg.minRoundsBetweenInterstitial) return false;
      if (lastShownAt !== null && (now() - lastShownAt) < cfg.minCooldownMs) return false;
      return true;
    },
    markShown() {
      roundsSinceLastAd = 0;
      lastShownAt = now();
    },
    getState() {
      return { totalCompleted, roundsSinceLastAd, lastShownAt };
    },
  };
}

module.exports = { createAdPolicy, DEFAULT_CONFIG };
