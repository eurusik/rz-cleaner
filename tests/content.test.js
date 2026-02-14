const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/Users/eurusik/Documents/New project';
const source = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');

function mustContain(snippet) {
  assert.ok(source.includes(snippet), `missing snippet: ${snippet}`);
}

test('content defines feature ids for new blocks', () => {
  mustContain('SMART_DELIVERY_BADGE: "smart-delivery-badge"');
  mustContain('EMAIL_SUBSCRIPTION_BANNER: "email-subscription-banner"');
  mustContain('PROMO_LABELS: "promo-labels"');
  mustContain('BONUS_POINTS: "bonus-points"');
  mustContain('SUPER_OFFER: "super-offer"');
  mustContain('PRODUCT_SERVICES: "product-services"');
});

test('content runs smart and email cleanup in main pipeline', () => {
  mustContain('hideSmartDeliveryBadge(root, settings);');
  mustContain('hideEmailSubscriptionBanner(root, settings);');
  mustContain('hideSuperOffer(root, settings);');
  mustContain('hideProductServices(root, settings);');
});

test('content removes smart and email markers when toggles are disabled', () => {
  mustContain('if (prevSettings.hideSmartDeliveryBadge && !nextSettings.hideSmartDeliveryBadge) {');
  mustContain('removeFeatureFromAll(document, FEATURE.SMART_DELIVERY_BADGE);');
  mustContain('if (prevSettings.hideEmailSubscriptionBanner && !nextSettings.hideEmailSubscriptionBanner) {');
  mustContain('removeFeatureFromAll(document, FEATURE.EMAIL_SUBSCRIPTION_BANNER);');
  mustContain('if (prevSettings.hideSuperOffer && !nextSettings.hideSuperOffer) {');
  mustContain('removeFeatureFromAll(document, FEATURE.SUPER_OFFER);');
  mustContain('if (prevSettings.hideProductServices && !nextSettings.hideProductServices) {');
  mustContain('removeFeatureFromAll(document, FEATURE.PRODUCT_SERVICES);');
});

test('content diagnostics include smart and email features', () => {
  mustContain('id: FEATURE.SMART_DELIVERY_BADGE,');
  mustContain('enabled: extensionEnabled && Boolean(settings.hideSmartDeliveryBadge),');
  mustContain('id: FEATURE.EMAIL_SUBSCRIPTION_BANNER,');
  mustContain('enabled: extensionEnabled && Boolean(settings.hideEmailSubscriptionBanner),');
  mustContain('id: FEATURE.SUPER_OFFER,');
  mustContain('enabled: extensionEnabled && Boolean(settings.hideSuperOffer),');
  mustContain('id: FEATURE.PRODUCT_SERVICES,');
  mustContain('enabled: extensionEnabled && Boolean(settings.hideProductServices),');
});

test('content observer hints include smart/delivery/email tags', () => {
  mustContain('"rz-smart-description-button"');
  mustContain('"rz-delivery-premium"');
  mustContain('"rz-delivery-price"');
  mustContain('"rz-marketing-subscription-banner"');
  mustContain('"rz-super-offer"');
  mustContain('"rz-product-services"');
  mustContain('"RZ-DELIVERY-PRICE"');
  mustContain('"RZ-MARKETING-SUBSCRIPTION-BANNER"');
  mustContain('"RZ-SUPER-OFFER"');
  mustContain('"RZ-PRODUCT-SERVICES"');
});
