const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createAdPolicy } = require('../adPolicy.js');

const root = path.resolve(__dirname, '..');
const pluginSrc = fs.readFileSync(path.join(root, 'node_modules', 'react-native-google-mobile-ads', 'plugin', 'build', 'index.js'), 'utf8');
const knownMatch = pluginSrc.match(/KNOWN_PLUGIN_PARAMETER_KEYS\s*=\s*\[([\s\S]*?)\]/);
const KNOWN_PLUGIN_PARAMETER_KEYS = [...knownMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

test('Satranc 2 ad policy enforces 2-wave onboarding, 3-wave threshold, and 3-minute cooldown', () => {
  let clock = 1_000_000;
  const policy = createAdPolicy({}, () => clock);
  assert.equal(policy.isEligible(), false);
  policy.recordRound();
  policy.recordRound();
  assert.equal(policy.isEligible(), false);
  policy.recordRound();
  assert.equal(policy.isEligible(), true);
  policy.markShown();
  assert.equal(policy.isEligible(), false);

  policy.recordRound();
  policy.recordRound();
  policy.recordRound();
  clock += 2 * 60 * 1000;
  assert.equal(policy.isEligible(), false);
  clock += 60 * 1000;
  assert.equal(policy.isEligible(), true);
});

test('Satranc 2 app.json AdMob plugin keys and test App IDs are valid', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const entry = appJson.expo.plugins.find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
  assert.ok(entry);
  const opts = entry[1];
  const known = new Set(KNOWN_PLUGIN_PARAMETER_KEYS);
  for (const key of Object.keys(opts)) {
    assert.ok(known.has(key), `Unknown AdMob plugin key: ${key}`);
  }
  assert.match(opts.androidAppId, /^ca-app-pub-3940256099942544~/);
  assert.match(opts.iosAppId, /^ca-app-pub-3940256099942544~/);
});

test('Satranc 2 IAP catalog has remove_ads and 200/500/1250/3000 soul gem packs', () => {
  const { IAP_PRODUCTS, IAP_SKUS, findIapProductById } = require('../iap.config.js');
  assert.equal(IAP_SKUS.length, 5);
  assert.equal(IAP_PRODUCTS.remove_ads.isConsumable, false);
  assert.deepEqual(
    [IAP_PRODUCTS.sg_200.soulGemsAmount, IAP_PRODUCTS.sg_500.soulGemsAmount, IAP_PRODUCTS.sg_1250.soulGemsAmount, IAP_PRODUCTS.sg_3000.soulGemsAmount],
    [200, 500, 1250, 3000]
  );
  for (const sku of IAP_SKUS) {
    assert.ok(findIapProductById(sku), `Missing catalog product for ${sku}`);
  }
});
