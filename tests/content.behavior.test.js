const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/content-harness');

const HIDDEN_ATTR = 'data-rz-clean-hidden';
const HIDDEN_CLASS = 'rzc-hidden';

function isHidden(el) {
  return (
    el.getAttribute(HIDDEN_ATTR) === '1' &&
    el.classList.contains(HIDDEN_CLASS) &&
    el.style.getPropertyValue('display') === 'none'
  );
}

function wireSmartAndEmailSelectors(harness, targets) {
  const { document } = harness;

  document.setQueryResult("rz-delivery-price use[href*='#icon-premium-smart']", [targets.deliveryPriceIcon]);
  document.setQueryResult("rz-delivery-price svg use[href*='#icon-premium-smart']", [targets.deliveryPriceIcon]);
  document.setQueryResult('rz-delivery-premium', [targets.deliveryPremium]);
  document.setQueryResult('rz-delivery-premium .premium--title', [targets.deliveryPremiumTitle]);
  document.setQueryResult("rz-delivery-premium use[href*='#icon-premium-smart']", [targets.deliveryPremiumIcon]);
  document.setQueryResult('rz-marketing-subscription-banner', [targets.emailBanner]);
  document.setQueryResult('rz-marketing-subscription-banner .content', [targets.emailBannerContent]);
  document.setQueryResult('rz-marketing-subscription-banner rz-modal-close-btn', [targets.emailBannerClose]);
  document.setQueryResult('rz-super-offer', [targets.superOffer]);
  document.setQueryResult("rz-super-offer [data-testid='super-offer']", [targets.superOfferInner]);
  document.setQueryResult('rz-super-offer .super-offer', [targets.superOfferContent]);
  document.setQueryResult('rz-product-services', [targets.productServices]);
  document.setQueryResult('rz-product-services .additional-services-container', [targets.productServicesContainer]);
  document.setQueryResult('rz-product-services rz-additional-services', [targets.productServicesInner]);
}

function makeTargets(harness) {
  const deliveryPrice = harness.createElement('rz-delivery-price');
  const deliveryPriceIcon = harness.createElement('use');
  deliveryPrice.appendChild(deliveryPriceIcon);

  const deliveryPremium = harness.createElement('rz-delivery-premium');
  const deliveryPremiumTitle = harness.createElement('div', { classes: ['premium--title'] });
  const deliveryPremiumIcon = harness.createElement('use');
  deliveryPremium.appendChild(deliveryPremiumTitle);
  deliveryPremium.appendChild(deliveryPremiumIcon);

  const emailBanner = harness.createElement('rz-marketing-subscription-banner');
  const emailBannerContent = harness.createElement('div', { classes: ['content'] });
  const emailBannerClose = harness.createElement('rz-modal-close-btn');
  emailBanner.appendChild(emailBannerContent);
  emailBanner.appendChild(emailBannerClose);

  const superOffer = harness.createElement('rz-super-offer');
  const superOfferInner = harness.createElement('div');
  superOfferInner.setAttribute('data-testid', 'super-offer');
  const superOfferContent = harness.createElement('div', { classes: ['super-offer'] });
  superOffer.appendChild(superOfferInner);
  superOffer.appendChild(superOfferContent);

  const productServices = harness.createElement('rz-product-services');
  const productServicesContainer = harness.createElement('div', { classes: ['additional-services-container'] });
  const productServicesInner = harness.createElement('rz-additional-services');
  productServices.appendChild(productServicesContainer);
  productServices.appendChild(productServicesInner);

  return {
    deliveryPrice,
    deliveryPriceIcon,
    deliveryPremium,
    deliveryPremiumTitle,
    deliveryPremiumIcon,
    emailBanner,
    emailBannerContent,
    emailBannerClose,
    superOffer,
    superOfferInner,
    superOfferContent,
    productServices,
    productServicesContainer,
    productServicesInner
  };
}

test('content hides smart delivery and email banner blocks on initial cleanup', async () => {
  const harness = createHarness();
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), true);
  assert.equal(isHidden(targets.deliveryPremium), true);
  assert.equal(isHidden(targets.emailBanner), true);
  assert.equal(isHidden(targets.superOffer), true);
  assert.equal(isHidden(targets.productServices), true);
});

test('content does not hide smart/email when toggles are disabled from settings', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: false,
    hideEmailSubscriptionBanner: false,
    hideSuperOffer: false,
    hideProductServices: false
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
});

test('content does not apply hiding when extension is globally disabled', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    enabled: false
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
});

test('content does not apply hiding when extension is paused', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    enabled: true,
    pauseUntil: 9999999999999
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
});

test('content reveals blocks when settings toggle off via storage change', async () => {
  const harness = createHarness();
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();
  assert.equal(isHidden(targets.deliveryPrice), true);
  assert.equal(isHidden(targets.emailBanner), true);
  assert.equal(isHidden(targets.superOffer), true);
  assert.equal(isHidden(targets.productServices), true);

  await harness.emitSettingsChange({
    hideSmartDeliveryBadge: false,
    hideEmailSubscriptionBanner: false,
    hideSuperOffer: false,
    hideProductServices: false
  });

  assert.equal(targets.deliveryPrice.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.deliveryPrice.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.emailBanner.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.emailBanner.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.superOffer.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.superOffer.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.productServices.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.productServices.classList.contains(HIDDEN_CLASS), false);
});

test('content applies hiding after pause ends via storage change', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    enabled: true,
    pauseUntil: 9999999999999
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();
  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);

  await harness.emitSettingsChange({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    enabled: true,
    pauseUntil: 0
  });

  assert.equal(isHidden(targets.deliveryPrice), true);
  assert.equal(isHidden(targets.deliveryPremium), true);
  assert.equal(isHidden(targets.emailBanner), true);
  assert.equal(isHidden(targets.superOffer), true);
  assert.equal(isHidden(targets.productServices), true);
});

test('observer childList mutation triggers cleanup for dynamically added delivery price block', async () => {
  const harness = createHarness();
  await harness.runContent();

  const observer = harness.getLastObserver();
  assert.ok(observer, 'observer was not created');

  const deliveryPrice = harness.createElement('rz-delivery-price');
  const deliveryPriceIcon = harness.createElement('use');
  deliveryPrice.appendChild(deliveryPriceIcon);

  deliveryPrice.setQueryResult("rz-delivery-price use[href*='#icon-premium-smart']", [deliveryPriceIcon]);
  deliveryPrice.setQueryResult("rz-delivery-price svg use[href*='#icon-premium-smart']", [deliveryPriceIcon]);

  observer.trigger([
    {
      type: 'childList',
      addedNodes: [deliveryPrice]
    }
  ]);

  assert.equal(isHidden(deliveryPrice), true);
});

test('style mutation marks hidden node as dirty and reveal clears inline hide styles', async () => {
  const harness = createHarness();
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();
  const observer = harness.getLastObserver();
  assert.ok(observer, 'observer was not created');
  assert.equal(isHidden(targets.deliveryPrice), true);

  for (let i = 0; i < 30; i += 1) {
    observer.trigger([{ type: 'attributes', target: targets.deliveryPrice, attributeName: 'style' }]);
  }

  assert.equal(targets.deliveryPrice.getAttribute('data-rzc-style-dirty'), '1');

  await harness.emitSettingsChange({ hideSmartDeliveryBadge: false });

  assert.equal(targets.deliveryPrice.getAttribute('data-rzc-style-dirty'), null);
  assert.equal(targets.deliveryPrice.style.getPropertyValue('display'), '');
  assert.equal(targets.deliveryPrice.style.getPropertyValue('visibility'), '');
});
