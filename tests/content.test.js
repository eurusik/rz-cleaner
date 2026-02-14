const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/Users/eurusik/Documents/New project';
const core = fs.readFileSync(path.join(ROOT, 'content-core.js'), 'utf8');
const entrypoint = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
const registry = fs.readFileSync(path.join(ROOT, 'feature-registry.js'), 'utf8');
const promo = fs.readFileSync(path.join(ROOT, 'features/promo.js'), 'utf8');
const ads = fs.readFileSync(path.join(ROOT, 'features/ads.js'), 'utf8');
const ai = fs.readFileSync(path.join(ROOT, 'features/ai.js'), 'utf8');
const smart = fs.readFileSync(path.join(ROOT, 'features/smart.js'), 'utf8');
const rich = fs.readFileSync(path.join(ROOT, 'features/rich-content-spoiler.js'), 'utf8');

function mustContain(text, snippet, label) {
  assert.ok(text.includes(snippet), `${label} missing snippet: ${snippet}`);
}

test('content core defines feature ids for new blocks', () => {
  mustContain(core, 'SMART_DELIVERY_BADGE: "smart-delivery-badge"', 'content-core.js');
  mustContain(core, 'EMAIL_SUBSCRIPTION_BANNER: "email-subscription-banner"', 'content-core.js');
  mustContain(core, 'PROMO_LABELS: "promo-labels"', 'content-core.js');
  mustContain(core, 'PRODUCT_PICTOGRAMS: "product-pictograms"', 'content-core.js');
  mustContain(core, 'PROMOTION_PRODUCT: "promotion-product"', 'content-core.js');
  mustContain(core, 'BONUS_POINTS: "bonus-points"', 'content-core.js');
  mustContain(core, 'SUPER_OFFER: "super-offer"', 'content-core.js');
  mustContain(core, 'PRODUCT_SERVICES: "product-services"', 'content-core.js');
  mustContain(core, 'STICKY_PRODUCT_CARRIAGE: "sticky-product-carriage"', 'content-core.js');
});

test('content core uses feature registry for cleanup and reconcile', () => {
  mustContain(core, 'FEATURE_REGISTRY.runFeatureCleanup(context, root, settings);', 'content-core.js');
  mustContain(core, 'FEATURE_REGISTRY.reconcile(context, prevSettings, nextSettings);', 'content-core.js');
  mustContain(core, 'FEATURE_REGISTRY.onDisabled(context, document);', 'content-core.js');
  mustContain(core, 'hideCustomSelectors(root, settings);', 'content-core.js');
});

test('feature modules include smart/email/super/services logic', () => {
  mustContain(smart, 'hideSmartDeliveryBadge', 'features/smart.js');
  mustContain(smart, 'hideEmailSubscriptionBanner', 'features/smart.js');
  mustContain(smart, 'hideSuperOffer', 'features/smart.js');
  mustContain(smart, 'hideProductServices', 'features/smart.js');
  mustContain(smart, 'stickyProductCarriageRules', 'features/smart.js');
  mustContain(smart, 'id: ctx.FEATURE.SMART_DELIVERY_BADGE', 'features/smart.js');
  mustContain(smart, 'id: ctx.FEATURE.EMAIL_SUBSCRIPTION_BANNER', 'features/smart.js');
});

test('feature modules include promo, ads, ai and rich spoiler hooks', () => {
  mustContain(promo, 'ctx.FEATURE.PROMO_MAIN', 'features/promo.js');
  mustContain(promo, 'ctx.FEATURE.PRODUCT_PICTOGRAMS', 'features/promo.js');
  mustContain(smart, 'ctx.FEATURE.PROMOTION_PRODUCT', 'features/smart.js');
  mustContain(ads, 'ctx.FEATURE.ADVERTISING', 'features/ads.js');
  mustContain(ai, 'ctx.FEATURE.AI_BUTTON', 'features/ai.js');
  mustContain(rich, 'Показати повний опис', 'features/rich-content-spoiler.js');
  mustContain(rich, 'Сховати повний опис', 'features/rich-content-spoiler.js');
  mustContain(rich, 'onDisabled', 'features/rich-content-spoiler.js');
});

test('feature registry aggregates modules', () => {
  mustContain(registry, 'runFeatureCleanup', 'feature-registry.js');
  mustContain(registry, 'diagnosticsEntries', 'feature-registry.js');
  mustContain(registry, 'globalThis.RZCFeatures', 'feature-registry.js');
});

test('content observer hints include smart/delivery/email and rich tags', () => {
  mustContain(core, '"rz-smart-description-button"', 'content-core.js');
  mustContain(core, '"rz-delivery-premium"', 'content-core.js');
  mustContain(core, '"rz-delivery-price"', 'content-core.js');
  mustContain(core, '"rz-marketing-subscription-banner"', 'content-core.js');
  mustContain(core, '"rz-product-pictograms"', 'content-core.js');
  mustContain(core, '"rz-promotion-product"', 'content-core.js');
  mustContain(core, '"rz-super-offer"', 'content-core.js');
  mustContain(core, '"rz-product-services"', 'content-core.js');
  mustContain(core, '"rz-product-carriage"', 'content-core.js');
  mustContain(core, '"rz-store-rich-content"', 'content-core.js');
  mustContain(core, '"RZ-STORE-RICH-CONTENT"', 'content-core.js');
  mustContain(core, '"RZ-PRODUCT-CARRIAGE"', 'content-core.js');
  mustContain(core, '"RZ-PRODUCT-PICTOGRAMS"', 'content-core.js');
  mustContain(core, '"RZ-PROMOTION-PRODUCT"', 'content-core.js');
});

test('content entrypoint is thin bootstrap', () => {
  assert.ok(entrypoint.includes('globalThis.RZCContentCore.init();'));
  assert.ok(entrypoint.includes('__RZC_CONTENT_BOOTSTRAP__'));
});
