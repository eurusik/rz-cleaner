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
  document.setQueryResult('.exponea-banner__block', [targets.exponeaMiniBanner]);
  document.setQueryResult('.exponea-banner__sales', [targets.exponeaMiniBannerLink]);
  document.setQueryResult('rz-red-card-link', [targets.redCardLink]);
  document.setQueryResult("rz-red-card-link a[href*='/rozetka-card/']", [targets.redCardAnchor]);
  document.setQueryResult('rz-smart-subscribe-link', [targets.smartSubscribeLink]);
  document.setQueryResult("rz-smart-subscribe-link a[href*='/smart/']", [targets.smartSubscribeAnchor]);
  document.setQueryResult('rz-super-offer', [targets.superOffer]);
  document.setQueryResult("rz-super-offer [data-testid='super-offer']", [targets.superOfferInner]);
  document.setQueryResult('rz-super-offer .super-offer', [targets.superOfferContent]);
  document.setQueryResult('rz-product-services', [targets.productServices]);
  document.setQueryResult('rz-product-services .additional-services-container', [targets.productServicesContainer]);
  document.setQueryResult('rz-product-services rz-additional-services', [targets.productServicesInner]);
  document.setQueryResult('rz-product-carriage', [targets.stickyCarriage]);
  document.setQueryResult('rz-product-carriage rz-sticky-buy', [targets.stickyCarriageBuy]);
  document.setQueryResult('rz-product-carriage .carriage__main', [targets.stickyCarriageMain]);
  document.setQueryResult('rz-promotion-product', [targets.promotionProduct]);
  document.setQueryResult('rz-promotion-product .product-promotion', [targets.promotionProductBody]);
  document.setQueryResult('rz-promotion-product .product-promotion__label', [targets.promotionProductLabel]);
  document.setQueryResult('rz-product-pictograms', [targets.productPictograms]);
  document.setQueryResult('rz-product-tile rz-product-pictograms', [targets.productPictograms]);
  document.setQueryResult('rz-product-pictograms .item', [targets.productPictogramsItem]);
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

  const exponeaMiniBanner = harness.createElement('div', { classes: ['exponea-banner__block'] });
  exponeaMiniBanner.setAttribute('id', 'exponea-banner__block');
  const exponeaMiniBannerLink = harness.createElement('a', { classes: ['exponea-banner__sales'] });
  exponeaMiniBanner.appendChild(exponeaMiniBannerLink);

  const redCardLink = harness.createElement('rz-red-card-link');
  const redCardAnchor = harness.createElement('a');
  redCardAnchor.setAttribute('href', 'https://rozetka.com.ua/ua/rozetka-card/');
  redCardLink.appendChild(redCardAnchor);

  const smartSubscribeLink = harness.createElement('rz-smart-subscribe-link');
  const smartSubscribeAnchor = harness.createElement('a');
  smartSubscribeAnchor.setAttribute('href', 'https://rozetka.com.ua/ua/smart/');
  smartSubscribeLink.appendChild(smartSubscribeAnchor);

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

  const stickyCarriage = harness.createElement('rz-product-carriage');
  const stickyCarriageMain = harness.createElement('div', { classes: ['carriage__main'] });
  const stickyCarriageBuy = harness.createElement('rz-sticky-buy');
  stickyCarriage.appendChild(stickyCarriageMain);
  stickyCarriage.appendChild(stickyCarriageBuy);

  const promotionProduct = harness.createElement('rz-promotion-product');
  const promotionProductBody = harness.createElement('div', { classes: ['product-promotion'] });
  const promotionProductLabel = harness.createElement('img', { classes: ['product-promotion__label'] });
  promotionProduct.appendChild(promotionProductBody);
  promotionProduct.appendChild(promotionProductLabel);

  const productPictograms = harness.createElement('rz-product-pictograms', { classes: ['vertical-theme'] });
  const productPictogramsItem = harness.createElement('div', { classes: ['item'] });
  productPictograms.appendChild(productPictogramsItem);

  return {
    deliveryPrice,
    deliveryPriceIcon,
    deliveryPremium,
    deliveryPremiumTitle,
    deliveryPremiumIcon,
    emailBanner,
    emailBannerContent,
    emailBannerClose,
    exponeaMiniBanner,
    exponeaMiniBannerLink,
    redCardLink,
    redCardAnchor,
    smartSubscribeLink,
    smartSubscribeAnchor,
    superOffer,
    superOfferInner,
    superOfferContent,
    productServices,
    productServicesContainer,
    productServicesInner,
    stickyCarriage,
    stickyCarriageMain,
    stickyCarriageBuy,
    promotionProduct,
    promotionProductBody,
    promotionProductLabel,
    productPictograms,
    productPictogramsItem
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
  assert.equal(isHidden(targets.exponeaMiniBanner), true);
  assert.equal(isHidden(targets.superOffer), true);
  assert.equal(isHidden(targets.productServices), true);
  assert.equal(isHidden(targets.stickyCarriage), true);
  assert.equal(isHidden(targets.promotionProduct), true);
  assert.equal(isHidden(targets.productPictograms), true);
});

test('content reveals exponea smart mini banner when smart toggle is disabled', async () => {
  const harness = createHarness();
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();
  assert.equal(isHidden(targets.exponeaMiniBanner), true);

  await harness.emitSettingsChange({ hideSmartDeliveryBadge: false });

  assert.equal(targets.exponeaMiniBanner.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.exponeaMiniBanner.classList.contains(HIDDEN_CLASS), false);
});

test('content hides sidebar rozetka-card and smart subscribe links with smart toggle', async () => {
  const harness = createHarness();
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.redCardLink), true);
  assert.equal(isHidden(targets.smartSubscribeLink), true);

  await harness.emitSettingsChange({ hideSmartDeliveryBadge: false });

  assert.equal(targets.redCardLink.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.redCardLink.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.smartSubscribeLink.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.smartSubscribeLink.classList.contains(HIDDEN_CLASS), false);
});

test('content does not hide smart/email when toggles are disabled from settings', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: false,
    hideEmailSubscriptionBanner: false,
    hideSuperOffer: false,
    hideProductServices: false,
    hideStickyProductCarriage: false,
    hidePromotionProduct: false,
    hideProductPictograms: false
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);
});

test('content does not apply hiding when extension is globally disabled', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    hideStickyProductCarriage: true,
    hidePromotionProduct: true,
    hideProductPictograms: true,
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
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);
});

test('content does not apply hiding when extension is paused', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    hideStickyProductCarriage: true,
    hidePromotionProduct: true,
    hideProductPictograms: true,
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
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);
});

test('content coerces string boolean toggles from storage', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: 'false',
    hideEmailSubscriptionBanner: 'false',
    hideSuperOffer: 'false',
    hideProductServices: 'false',
    hideStickyProductCarriage: 'false',
    hidePromotionProduct: 'false',
    hideProductPictograms: 'false'
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);
});

test('content treats enabled=\"false\" in storage as disabled extension state', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    hideStickyProductCarriage: true,
    hidePromotionProduct: true,
    hideProductPictograms: true,
    enabled: 'false'
  });
  const targets = makeTargets(harness);
  wireSmartAndEmailSelectors(harness, targets);

  await harness.runContent();

  assert.equal(isHidden(targets.deliveryPrice), false);
  assert.equal(isHidden(targets.deliveryPremium), false);
  assert.equal(isHidden(targets.emailBanner), false);
  assert.equal(isHidden(targets.superOffer), false);
  assert.equal(isHidden(targets.productServices), false);
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);
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
  assert.equal(isHidden(targets.stickyCarriage), true);
  assert.equal(isHidden(targets.promotionProduct), true);
  assert.equal(isHidden(targets.productPictograms), true);

  await harness.emitSettingsChange({
    hideSmartDeliveryBadge: false,
    hideEmailSubscriptionBanner: false,
    hideSuperOffer: false,
    hideProductServices: false,
    hideStickyProductCarriage: false,
    hidePromotionProduct: false,
    hideProductPictograms: false
  });

  assert.equal(targets.deliveryPrice.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.deliveryPrice.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.emailBanner.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.emailBanner.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.superOffer.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.superOffer.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.productServices.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.productServices.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.stickyCarriage.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.stickyCarriage.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.promotionProduct.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.promotionProduct.classList.contains(HIDDEN_CLASS), false);
  assert.equal(targets.productPictograms.getAttribute(HIDDEN_ATTR), null);
  assert.equal(targets.productPictograms.classList.contains(HIDDEN_CLASS), false);
});

test('content applies hiding after pause ends via storage change', async () => {
  const harness = createHarness({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    hideStickyProductCarriage: true,
    hidePromotionProduct: true,
    hideProductPictograms: true,
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
  assert.equal(isHidden(targets.stickyCarriage), false);
  assert.equal(isHidden(targets.promotionProduct), false);
  assert.equal(isHidden(targets.productPictograms), false);

  await harness.emitSettingsChange({
    hideSmartDeliveryBadge: true,
    hideEmailSubscriptionBanner: true,
    hideSuperOffer: true,
    hideProductServices: true,
    hideStickyProductCarriage: true,
    hidePromotionProduct: true,
    hideProductPictograms: true,
    enabled: true,
    pauseUntil: 0
  });

  assert.equal(isHidden(targets.deliveryPrice), true);
  assert.equal(isHidden(targets.deliveryPremium), true);
  assert.equal(isHidden(targets.emailBanner), true);
  assert.equal(isHidden(targets.superOffer), true);
  assert.equal(isHidden(targets.productServices), true);
  assert.equal(isHidden(targets.stickyCarriage), true);
  assert.equal(isHidden(targets.promotionProduct), true);
  assert.equal(isHidden(targets.productPictograms), true);
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

test('observer childList mutation hides dynamically added exponea smart mini banner', async () => {
  const harness = createHarness();
  await harness.runContent();

  const observer = harness.getLastObserver();
  assert.ok(observer, 'observer was not created');

  const miniBanner = harness.createElement('div', { classes: ['exponea-banner__block'] });
  const miniBannerLink = harness.createElement('a', { classes: ['exponea-banner__sales'] });
  miniBanner.appendChild(miniBannerLink);
  miniBanner.setQueryResult('.exponea-banner__sales', [miniBannerLink]);

  observer.trigger([
    {
      type: 'childList',
      addedNodes: [miniBanner]
    }
  ]);

  assert.equal(isHidden(miniBanner), true);
});

test('observer childList mutation hides dynamically added sidebar smart links', async () => {
  const harness = createHarness();
  await harness.runContent();

  const observer = harness.getLastObserver();
  assert.ok(observer, 'observer was not created');

  const redCardLink = harness.createElement('rz-red-card-link');
  const redCardAnchor = harness.createElement('a');
  redCardAnchor.setAttribute('href', 'https://rozetka.com.ua/ua/rozetka-card/');
  redCardLink.appendChild(redCardAnchor);
  redCardLink.setQueryResult("rz-red-card-link a[href*='/rozetka-card/']", [redCardAnchor]);

  const smartSubscribeLink = harness.createElement('rz-smart-subscribe-link');
  const smartSubscribeAnchor = harness.createElement('a');
  smartSubscribeAnchor.setAttribute('href', 'https://rozetka.com.ua/ua/smart/');
  smartSubscribeLink.appendChild(smartSubscribeAnchor);
  smartSubscribeLink.setQueryResult("rz-smart-subscribe-link a[href*='/smart/']", [smartSubscribeAnchor]);

  observer.trigger([
    {
      type: 'childList',
      addedNodes: [redCardLink, smartSubscribeLink]
    }
  ]);

  assert.equal(isHidden(redCardLink), true);
  assert.equal(isHidden(smartSubscribeLink), true);
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

test('content keeps cleanup running when closest selector resolution throws', async () => {
  const harness = createHarness();
  const riskyNode = harness.createElement('div');
  riskyNode.closest = () => {
    throw new Error('invalid selector');
  };

  harness.document.setQueryResult('rz-product-tile [data-testid="promo-price"]', [riskyNode]);

  await harness.runContent();

  assert.equal(isHidden(riskyNode), true);
});

test('content adds tile gallery arrows and switches image on click', async () => {
  const harness = createHarness();
  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/original/main.jpg');
  image.setAttribute('data-hover-image', 'https://content.rozetka.com.ua/goods/images/original/hover.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();

  const arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(arrows.length, 2);

  const next = arrows.find((node) => node.getAttribute('data-rzc-tile-gallery-btn') === 'next');
  assert.ok(next);
  const clickHandlers = next.listeners.get('click') || [];
  assert.equal(clickHandlers.length > 0, true);
  clickHandlers[0]({ preventDefault() {}, stopPropagation() {} });

  assert.equal(image.getAttribute('src'), 'https://content.rozetka.com.ua/goods/images/big_tile/hover.jpg');
});

test('content fetches product page urls when tile has only one image url', async () => {
  const fetchCalls = [];
  const harness = createHarness(
    {},
    {
      fetchImpl: async (href) => {
        fetchCalls.push(String(href));
        return {
          ok: true,
          text: async () => `
            <img src="https://content.rozetka.com.ua/goods/images/original/594346714.jpg">
            <img src="https://content.rozetka.com.ua/goods/images/original/594346720.jpg">
            <img src="https://content2.rozetka.com.ua/goods/images/original/594346725.jpg">
          `
        };
      },
      locationHref: 'https://rozetka.com.ua/ua/mobile-phones/c80003/'
    }
  );
  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  imageHost.setAttribute('href', '/ua/apple-iphone-17-pro-256gb-deep-blue-mg8j4af-a/p543545605/');
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/big_tile/594346714.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  tile.setQueryResult('a.tile-image-host', [imageHost]);
  tile.setQueryResult('a.tile-image-host[href]', [imageHost]);
  tile.setQueryResult('a.tile-title[href]', []);
  tile.setQueryResult("a[href*='/p']", [imageHost]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }

  const arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(fetchCalls.length > 0, true);
  assert.equal(
    fetchCalls[0],
    'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-deep-blue-mg8j4af-a/p543545605/'
  );
  assert.equal(arrows.length, 2);
  assert.equal(tile.getAttribute('data-rzc-tile-gallery-ready'), '1');
});

test('content retries remote fallback fetch after initial empty result', async () => {
  let fetchCallCount = 0;
  const harness = createHarness(
    {},
    {
      fetchImpl: async () => {
        fetchCallCount += 1;
        if (fetchCallCount === 1) {
          return {
            ok: true,
            text: async () => `
              <img src="https://content.rozetka.com.ua/goods/images/original/594346714.jpg">
            `
          };
        }
        return {
          ok: true,
          text: async () => `
            <img src="https://content.rozetka.com.ua/goods/images/original/594346714.jpg">
            <img src="https://content.rozetka.com.ua/goods/images/original/594346720.jpg">
          `
        };
      },
      locationHref: 'https://rozetka.com.ua/ua/mobile-phones/c80003/'
    }
  );

  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  imageHost.setAttribute('href', '/ua/apple-iphone-17-pro-256gb-deep-blue-mg8j4af-a/p543545605/');
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/big_tile/594346714.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  tile.setQueryResult('a.tile-image-host', [imageHost]);
  tile.setQueryResult('a.tile-image-host[href]', [imageHost]);
  tile.setQueryResult('a.tile-title[href]', []);
  tile.setQueryResult("a[href*='/p']", [imageHost]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }

  let arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(arrows.length, 0);
  assert.equal(fetchCallCount, 1);

  const hoverHandlers = imageHost.listeners.get('mouseenter') || [];
  assert.equal(hoverHandlers.length > 0, true);
  hoverHandlers[0]();

  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }

  arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(fetchCallCount, 2);
  assert.equal(arrows.length, 2);
  assert.equal(tile.getAttribute('data-rzc-tile-gallery-ready'), '1');
});

test('content skips cross-origin remote fallback fetch to avoid CORS retries', async () => {
  let fetchCallCount = 0;
  const harness = createHarness(
    {},
    {
      fetchImpl: async () => {
        fetchCallCount += 1;
        return {
          ok: true,
          text: async () => ''
        };
      },
      locationHref: 'https://rozetka.com.ua/ua/mobile-phones/c80003/'
    }
  );

  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  imageHost.setAttribute('href', 'https://hard.rozetka.com.ua/ua/apple-iphone-17-pro-256gb/p543545605/');
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/big_tile/594346714.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  tile.setQueryResult('a.tile-image-host', [imageHost]);
  tile.setQueryResult('a.tile-image-host[href]', [imageHost]);
  tile.setQueryResult('a.tile-title[href]', []);
  tile.setQueryResult("a[href*='/p']", [imageHost]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }

  const hoverHandlers = imageHost.listeners.get('mouseenter') || [];
  if (hoverHandlers[0]) hoverHandlers[0]();
  if (hoverHandlers[0]) hoverHandlers[0]();

  const arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(fetchCallCount, 0);
  assert.equal(arrows.length, 0);
});

test('content refreshes indexed tile gallery when bridge delivers matching product images', async () => {
  const harness = createHarness({}, { locationHref: 'https://rozetka.com.ua/ua/mobile-phones/c80003/' });
  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  imageHost.setAttribute('href', '/ua/apple-iphone-17-pro-256gb-deep-blue-mg8j4af-a/p543545605/');
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/big_tile/594346714.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  tile.setQueryResult('a.tile-image-host', [imageHost]);
  tile.setQueryResult('a.tile-image-host[href]', [imageHost]);
  tile.setQueryResult('a.tile-title[href]', []);
  tile.setQueryResult("a[href*='/p']", [imageHost]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();

  let arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(arrows.length, 0);

  harness.emitWindowMessage({
    source: 'RZC_PAGE_BRIDGE',
    type: 'RZC_TILE_GALLERY_PRODUCTS',
    payload: {
      data: [
        {
          id: '543545605',
          images: {
            all: [
              'https://content.rozetka.com.ua/goods/images/original/594346714.jpg',
              'https://content.rozetka.com.ua/goods/images/original/594346720.jpg'
            ]
          }
        }
      ]
    }
  });

  arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(arrows.length, 2);
  assert.equal(tile.getAttribute('data-rzc-tile-gallery-ready'), '1');
});

test('content mounts gallery arrows on tile-image-host instead of wrapper div', async () => {
  const harness = createHarness();
  const tile = harness.createElement('rz-product-tile');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  const innerWrapper = harness.createElement('div', { classes: ['image-wrapper'] });
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/original/main.jpg');
  image.setAttribute('data-hover-image', 'https://content.rozetka.com.ua/goods/images/original/hover.jpg');
  innerWrapper.appendChild(image);
  imageHost.appendChild(innerWrapper);
  tile.appendChild(imageHost);

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  tile.setQueryResult('a.tile-image-host', [imageHost]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();

  const hostArrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  const wrapperArrows = innerWrapper.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(hostArrows.length, 2);
  assert.equal(wrapperArrows.length, 0);
});

test('content recreates tile gallery arrows when ready tile state exists but arrows are missing', async () => {
  const harness = createHarness();
  const tile = harness.createElement('rz-product-tile');
  tile.setAttribute('data-rzc-tile-gallery-ready', '1');
  const imageHost = harness.createElement('a', { classes: ['tile-image-host'] });
  const image = harness.createElement('img', { classes: ['tile-image'] });
  image.setAttribute('src', 'https://content.rozetka.com.ua/goods/images/original/main.jpg');
  image.setAttribute('data-hover-image', 'https://content.rozetka.com.ua/goods/images/original/hover.jpg');
  imageHost.appendChild(image);
  tile.appendChild(imageHost);
  tile.__rzcGalleryState = {
    tile,
    host: imageHost,
    primaryImg: image,
    productId: '',
    urls: [
      'https://content.rozetka.com.ua/goods/images/big_tile/main.jpg',
      'https://content.rozetka.com.ua/goods/images/big_tile/hover.jpg'
    ],
    currentIndex: 0,
    loading: false,
    loadToken: 0,
    warmPreloadStarted: false,
    lastBridgeCheck: 0,
    counterEl: null
  };

  harness.document.setQueryResult('rz-product-tile', [tile]);
  tile.setQueryResult('a.tile-image-host img.tile-image', [image]);
  tile.setQueryResult('img', [image]);
  imageHost.setQueryResult('img', [image]);
  tile.setQueryResult(`[data-rzc-tile-gallery-btn]`, []);

  await harness.runContent();

  const arrows = imageHost.children.filter((node) => node.getAttribute('data-rzc-tile-gallery-btn'));
  assert.equal(arrows.length, 2);
});

test('content ignores cyclic bridge payloads without throwing', async () => {
  const harness = createHarness();
  await harness.runContent();

  const payload = { data: [] };
  payload.self = payload;

  assert.doesNotThrow(() => {
    harness.emitWindowMessage({
      source: 'RZC_PAGE_BRIDGE',
      type: 'RZC_TILE_GALLERY_PRODUCTS',
      payload
    });
  });
});

test('content caps tile gallery cache size after many bridge updates', async () => {
  const harness = createHarness();
  await harness.runContent();

  const products = Array.from({ length: 3105 }, (_, idx) => ({
    id: String(idx + 1),
    images: {
      all: [
        `https://content.rozetka.com.ua/goods/images/original/${idx + 1}-a.jpg`,
        `https://content.rozetka.com.ua/goods/images/original/${idx + 1}-b.jpg`
      ]
    }
  }));

  harness.emitWindowMessage({
    source: 'RZC_PAGE_BRIDGE',
    type: 'RZC_TILE_GALLERY_PRODUCTS',
    payload: { data: products }
  });

  const stats = harness.getTileGalleryStats();
  assert.ok(stats);
  assert.equal(stats.cacheSize, 3000);
});

test('content collapses store rich content and restores it when extension is disabled', async () => {
  const harness = createHarness({ enabled: true });
  const richBlock = harness.createElement('rz-store-rich-content');
  const richContent = harness.createElement('div', {
    classes: ['rich-content'],
    textContent: 'x'.repeat(240)
  });
  richBlock.appendChild(richContent);

  harness.document.setQueryResult('rz-store-rich-content, rz-rich-content', [richBlock]);
  richBlock.setQueryResult('.rich-content, .rich', [richContent]);

  await harness.runContent();

  assert.equal(richBlock.classList.contains('rzc-rich-collapsed'), true);
  assert.equal(richBlock.getAttribute('data-rzc-rich-collapsible'), '1');

  await harness.emitSettingsChange({ enabled: false });

  assert.equal(richBlock.classList.contains('rzc-rich-collapsed'), false);
  assert.equal(richBlock.getAttribute('data-rzc-rich-collapsible'), null);
});

test('content collapses rz-rich-content blocks and restores them when extension is disabled', async () => {
  const harness = createHarness({ enabled: true });
  const richBlock = harness.createElement('rz-rich-content');
  const richContent = harness.createElement('div', {
    classes: ['rich', 'text-overflow', 'open'],
    textContent: 'x'.repeat(240)
  });
  richBlock.appendChild(richContent);

  harness.document.setQueryResult('rz-store-rich-content, rz-rich-content', [richBlock]);
  richBlock.setQueryResult('.rich-content, .rich', [richContent]);

  await harness.runContent();

  assert.equal(richBlock.classList.contains('rzc-rich-collapsed'), true);
  assert.equal(richBlock.getAttribute('data-rzc-rich-collapsible'), '1');

  await harness.emitSettingsChange({ enabled: false });

  assert.equal(richBlock.classList.contains('rzc-rich-collapsed'), false);
  assert.equal(richBlock.getAttribute('data-rzc-rich-collapsible'), null);
});
