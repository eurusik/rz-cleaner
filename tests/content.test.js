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
});

test('content runs smart and email cleanup in main pipeline', () => {
  mustContain('hideSmartDeliveryBadge(root, settings);');
  mustContain('hideEmailSubscriptionBanner(root, settings);');
});

test('content removes smart and email markers when toggles are disabled', () => {
  mustContain('if (prevSettings.hideSmartDeliveryBadge && !nextSettings.hideSmartDeliveryBadge) {');
  mustContain('removeFeatureFromAll(document, FEATURE.SMART_DELIVERY_BADGE);');
  mustContain('if (prevSettings.hideEmailSubscriptionBanner && !nextSettings.hideEmailSubscriptionBanner) {');
  mustContain('removeFeatureFromAll(document, FEATURE.EMAIL_SUBSCRIPTION_BANNER);');
});

test('content diagnostics include smart and email features', () => {
  mustContain('id: FEATURE.SMART_DELIVERY_BADGE,');
  mustContain('enabled: Boolean(settings.hideSmartDeliveryBadge),');
  mustContain('id: FEATURE.EMAIL_SUBSCRIPTION_BANNER,');
  mustContain('enabled: Boolean(settings.hideEmailSubscriptionBanner),');
});

test('content observer hints include smart/delivery/email tags', () => {
  mustContain('"rz-smart-description-button"');
  mustContain('"rz-delivery-premium"');
  mustContain('"rz-delivery-price"');
  mustContain('"rz-marketing-subscription-banner"');
  mustContain('"RZ-DELIVERY-PRICE"');
  mustContain('"RZ-MARKETING-SUBSCRIPTION-BANNER"');
});
