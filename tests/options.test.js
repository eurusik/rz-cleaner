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
  mustContainIn(html, 'id="hideSuperOffer"', 'options.html');
  mustContainIn(html, 'id="hideProductServices"', 'options.html');
  mustContainIn(html, 'id="hideStickyProductCarriage"', 'options.html');
  mustContainIn(html, 'id="hidePromoLabels"', 'options.html');
  mustContainIn(html, 'id="hideBonusPoints"', 'options.html');
  mustContainIn(html, 'id="extensionEnabled"', 'options.html');
  mustContainIn(html, 'id="applyRecommendedSettings"', 'options.html');
  mustContainIn(html, 'id="runDiagnosticsNow"', 'options.html');
  mustContainIn(html, 'id="copyActiveSelectorsStatus"', 'options.html');
  mustContainIn(html, 'class="advanced-subdetails"', 'options.html');
});

test('options.js maps settings keys for smart and email features', () => {
  mustContainIn(js, '"smart-delivery-badge": "hideSmartDeliveryBadge"', 'options.js');
  mustContainIn(js, '"email-subscription-banner": "hideEmailSubscriptionBanner"', 'options.js');
  mustContainIn(js, '"super-offer": "hideSuperOffer"', 'options.js');
  mustContainIn(js, '"product-services": "hideProductServices"', 'options.js');
  mustContainIn(js, '"sticky-product-carriage": "hideStickyProductCarriage"', 'options.js');
  mustContainIn(js, '"promo-labels": "hidePromoLabels"', 'options.js');
  mustContainIn(js, '"bonus-points": "hideBonusPoints"', 'options.js');
});

test('options.js has diagnostics labels for smart and email features', () => {
  mustContainIn(js, '"smart-delivery-badge": "Smart-блоки (бейдж + підписка Smart)"', 'options.js');
  mustContainIn(js, '"email-subscription-banner": "Банер підписки на email"', 'options.js');
  mustContainIn(js, '"super-offer": "Блок “Рекомендуємо” (Super Offer)"', 'options.js');
  mustContainIn(js, '"product-services": "Блок “Додаткові послуги”"', 'options.js');
  mustContainIn(js, '"sticky-product-carriage": "Плаваючий нижній блок купівлі"', 'options.js');
  mustContainIn(js, '"promo-labels": "Promo-бейджі (ТОП ПРОДАЖІВ / НОВИНКА / -%)"', 'options.js');
  mustContainIn(js, '"bonus-points": "Рядок “+ N бонусних ₴”"', 'options.js');
});

test('options.js includes built-in selectors sections for smart and email', () => {
  mustContainIn(js, 'const smartDeliveryBadge = (SELECTORS.smartDeliveryBadge || [])', 'options.js');
  mustContainIn(js, 'const emailSubscriptionBanner = (SELECTORS.emailSubscriptionBanner || [])', 'options.js');
  mustContainIn(js, 'const superOffer = (SELECTORS.superOffer || [])', 'options.js');
  mustContainIn(js, 'const productServices = (SELECTORS.productServices || [])', 'options.js');
  mustContainIn(js, 'const stickyProductCarriage = (SELECTORS.stickyProductCarriage || [])', 'options.js');
  mustContainIn(js, 'const promoLabels = (SELECTORS.promoLabels || [])', 'options.js');
  mustContainIn(js, 'const bonusPoints = (SELECTORS.bonusPoints || [])', 'options.js');
  mustContainIn(js, '# Promo labels selectors (built-in)', 'options.js');
  mustContainIn(js, '# Bonus points selectors (built-in)', 'options.js');
  mustContainIn(js, '# Smart delivery badge selectors (built-in)', 'options.js');
  mustContainIn(js, '# Email subscription banner selectors (built-in)', 'options.js');
  mustContainIn(js, '# Super offer selectors (built-in)', 'options.js');
  mustContainIn(js, '# Product services selectors (built-in)', 'options.js');
  mustContainIn(js, '# Sticky product carriage selectors (built-in)', 'options.js');
});
