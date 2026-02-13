const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/Users/eurusik/Documents/New project';
const html = fs.readFileSync(path.join(ROOT, 'options.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');

function mustContainIn(text, snippet, name) {
  assert.ok(text.includes(snippet), `${name} is missing snippet: ${snippet}`);
}

test('options.html has toggles for smart and email features', () => {
  mustContainIn(html, 'id="hideSmartDeliveryBadge"', 'options.html');
  mustContainIn(html, 'id="hideEmailSubscriptionBanner"', 'options.html');
});

test('options.js maps settings keys for smart and email features', () => {
  mustContainIn(js, '"smart-delivery-badge": "hideSmartDeliveryBadge"', 'options.js');
  mustContainIn(js, '"email-subscription-banner": "hideEmailSubscriptionBanner"', 'options.js');
});

test('options.js has diagnostics labels for smart and email features', () => {
  mustContainIn(js, '"smart-delivery-badge": "Smart-блоки (бейдж + підписка Smart)"', 'options.js');
  mustContainIn(js, '"email-subscription-banner": "Банер підписки на email"', 'options.js');
});

test('options.js includes built-in selectors sections for smart and email', () => {
  mustContainIn(js, 'const smartDeliveryBadge = (SELECTORS.smartDeliveryBadge || [])', 'options.js');
  mustContainIn(js, 'const emailSubscriptionBanner = (SELECTORS.emailSubscriptionBanner || [])', 'options.js');
  mustContainIn(js, '# Smart delivery badge selectors (built-in)', 'options.js');
  mustContainIn(js, '# Email subscription banner selectors (built-in)', 'options.js');
});
