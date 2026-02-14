const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/popup-harness');

test('popup loads toggle values from synced settings', async () => {
  const harness = createHarness({
    syncSettings: {
      enabled: true,
      hideAdvertisingSections: false,
      hidePromoBlocks: true,
      enableTileGallery: false,
      normalizePriceLayout: true
    }
  });

  await harness.runPopup();

  assert.equal(harness.getById('extensionEnabled').checked, true);
  assert.equal(harness.getById('hideAdvertisingSections').checked, false);
  assert.equal(harness.getById('hidePromoBlocks').checked, true);
  assert.equal(harness.getById('enableTileGallery').checked, false);
  assert.equal(harness.getById('normalizePriceLayout').checked, true);
});

test('popup master toggle saves enabled=false and clears pauseUntil', async () => {
  const harness = createHarness({
    syncSettings: {
      enabled: true,
      pauseUntil: Date.now() + 3600_000
    }
  });

  await harness.runPopup();

  const master = harness.getById('extensionEnabled');
  master.checked = false;
  master.dispatch('change');

  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.enabled, false);
  assert.equal(lastCall.rzc_settings.pauseUntil, 0);
});

test('popup pause button sets pauseUntil in future and disables toggles', async () => {
  const harness = createHarness({ syncSettings: { enabled: true, pauseUntil: 0 } });
  await harness.runPopup();

  const pauseBtn = harness.getById('disableOneHour');
  pauseBtn.dispatch('click');

  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.enabled, true);
  assert.ok(lastCall.rzc_settings.pauseUntil > Date.now());
  assert.equal(harness.getById('hideAdvertisingSections').disabled, true);
  assert.ok((harness.getById('pauseInfo').textContent || '').includes('Пауза до'));
});

test('popup shows only signaled toggles on catalog pages', async () => {
  const harness = createHarness({
    syncSettings: { enabled: true },
    activeTabUrl: 'https://rozetka.com.ua/ua/mobile-phones/c80003/',
    tabContext: {
      updatedAt: Date.now(),
      url: 'https://rozetka.com.ua/ua/mobile-phones/c80003/',
      pageType: 'catalog',
      features: [
        { id: 'tile-gallery', selectorMatches: 1, hiddenCount: 0, textMatch: null },
        { id: 'normalize-price-layout', selectorMatches: 1, hiddenCount: 0, textMatch: null },
        { id: 'advertising', selectorMatches: 0, hiddenCount: 0, textMatch: null }
      ]
    }
  });
  await harness.runPopup();

  assert.equal(harness.getById('row-enableTileGallery').hidden, false);
  assert.equal(harness.getById('row-normalizePriceLayout').hidden, false);
  assert.equal(harness.getById('row-hideAdvertisingSections').hidden, true);
});

test('popup hides all toggles when no live or same-url snapshot exists', async () => {
  const harness = createHarness({
    syncSettings: { enabled: true },
    activeTabUrl: 'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-cosmic-orange-mg8h4af-a/p543545585/'
  });
  await harness.runPopup();

  assert.equal(harness.getById('row-enableTileGallery').hidden, true);
  assert.equal(harness.getById('row-normalizePriceLayout').hidden, true);
  assert.equal(harness.getById('row-hideAdvertisingSections').hidden, true);
  assert.equal(harness.getById('row-hidePromoBlocks').hidden, true);
});

test('popup applies visibility from diagnostics when live snapshot is unavailable but url matches', async () => {
  const harness = createHarness({
    syncSettings: { enabled: true },
    activeTabUrl: 'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-cosmic-orange-mg8h4af-a/p543545585/',
    diagnostics: {
      updatedAt: Date.now(),
      url: 'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-cosmic-orange-mg8h4af-a/p543545585/',
      features: [
        { id: 'advertising', selectorMatches: 1, hiddenCount: 1, textMatch: null },
        { id: 'promo-main', selectorMatches: 1, hiddenCount: 1, textMatch: null },
        { id: 'tile-gallery', selectorMatches: 0, hiddenCount: 0, textMatch: null },
        { id: 'normalize-price-layout', selectorMatches: 0, hiddenCount: 0, textMatch: null }
      ]
    }
  });
  await harness.runPopup();

  assert.equal(harness.getById('row-enableTileGallery').hidden, true);
  assert.equal(harness.getById('row-normalizePriceLayout').hidden, true);
  assert.equal(harness.getById('row-hideAdvertisingSections').hidden, false);
  assert.equal(harness.getById('row-hidePromoBlocks').hidden, false);
});

test('popup uses page context from content script message when available', async () => {
  const harness = createHarness({
    syncSettings: { enabled: true },
    activeTabUrl: 'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-cosmic-orange-mg8h4af-a/p543545585/',
    tabContext: {
      url: 'https://rozetka.com.ua/ua/apple-iphone-17-pro-256gb-cosmic-orange-mg8h4af-a/p543545585/',
      pageType: 'product'
    }
  });
  await harness.runPopup();

  assert.equal(harness.getById('row-enableTileGallery').hidden, true);
  assert.equal(harness.getById('row-normalizePriceLayout').hidden, true);
});

test('popup uses live feature snapshot from content script for visibility', async () => {
  const harness = createHarness({
    syncSettings: { enabled: true },
    activeTabUrl: 'https://rozetka.com.ua/ua/mobile-phones/c80003/',
    tabContext: {
      updatedAt: Date.now(),
      url: 'https://rozetka.com.ua/ua/mobile-phones/c80003/',
      pageType: 'catalog',
      features: [
        { id: 'advertising', selectorMatches: 1, hiddenCount: 1, textMatch: null },
        { id: 'promo-main', selectorMatches: 0, hiddenCount: 0, textMatch: null },
        { id: 'tile-gallery', selectorMatches: 1, hiddenCount: 0, textMatch: null },
        { id: 'normalize-price-layout', selectorMatches: 1, hiddenCount: 0, textMatch: null }
      ]
    }
  });
  await harness.runPopup();

  assert.equal(harness.getById('row-hideAdvertisingSections').hidden, false);
  assert.equal(harness.getById('row-hidePromoBlocks').hidden, true);
  assert.equal(harness.getById('row-enableTileGallery').hidden, false);
  assert.equal(harness.getById('row-normalizePriceLayout').hidden, false);
});
