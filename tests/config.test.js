const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';

function loadConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  const sandbox = { globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.globalThis.RZC_CONFIG;
}

test('config exposes defaults and selectors', () => {
  const config = loadConfig();
  assert.ok(config);
  assert.ok(config.defaults);
  assert.ok(config.selectors);
});

test('config defaults include all boolean toggles', () => {
  const defaults = loadConfig().defaults;
  const expected = [
    'hidePromoBlocks',
    'hidePromoLabels',
    'hideProductPictograms',
    'hideRedBonusBlocks',
    'hideBonusPoints',
    'hideAdvertisingSections',
    'hideQuickFilters',
    'hideRozetkaAI',
    'hideAiConsultationBlock',
    'hidePopularSearchChips',
    'hideSmartDeliveryBadge',
    'hideEmailSubscriptionBanner',
    'hideSuperOffer',
    'hideProductServices',
    'hideStickyProductCarriage',
    'hidePromotionProduct',
    'normalizePriceLayout'
  ];

  for (const key of expected) {
    assert.equal(typeof defaults[key], 'boolean', `missing boolean default: ${key}`);
  }
});

test('config smart selectors cover tile, premium, and delivery price blocks', () => {
  const rules = loadConfig().selectors.smartDeliveryBadge || [];
  const queries = rules.map((r) => r.query);

  assert.ok(queries.includes("rz-product-tile use[href*='#icon-premium-smart']"));
  assert.ok(queries.includes('rz-delivery-premium'));
  assert.ok(queries.includes("rz-delivery-price use[href*='#icon-premium-smart']"));
});

test('config has selector for marketing email banner', () => {
  const rules = loadConfig().selectors.emailSubscriptionBanner || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-marketing-subscription-banner'));
});

test('config has selector for product pictograms block', () => {
  const rules = loadConfig().selectors.productPictograms || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-product-pictograms'));
});

test('config has selector for super offer block', () => {
  const rules = loadConfig().selectors.superOffer || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-super-offer'));
});

test('config has selector for product services block', () => {
  const rules = loadConfig().selectors.productServices || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-product-services'));
});

test('config has selector for sticky product carriage block', () => {
  const rules = loadConfig().selectors.stickyProductCarriage || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-product-carriage'));
});

test('config has selector for promotion product block', () => {
  const rules = loadConfig().selectors.promotionProduct || [];
  const queries = rules.map((r) => r.query);
  assert.ok(queries.includes('rz-promotion-product'));
});
