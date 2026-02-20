const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/options-harness');

test('options saves checkbox changes to chrome.storage.sync', async () => {
  const harness = createHarness({
    syncSettings: {
      hideSmartDeliveryBadge: true,
      hideEmailSubscriptionBanner: true
    }
  });

  await harness.runOptions();

  const smartToggle = harness.getById('hideSmartDeliveryBadge');
  assert.equal(smartToggle.checked, true);

  smartToggle.checked = false;
  smartToggle.dispatch('change');

  assert.ok(harness.syncSetCalls.length > 0);
  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.hideSmartDeliveryBadge, false);
});

test('options saves textarea input changes to chrome.storage.sync', async () => {
  const harness = createHarness({
    syncSettings: {
      customHideSelectors: ''
    }
  });

  await harness.runOptions();

  const customSelectors = harness.getById('customHideSelectors');
  customSelectors.value = '.banner\n.promo';
  customSelectors.dispatch('input');

  assert.ok(harness.syncSetCalls.length > 0);
  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.customHideSelectors, '.banner\n.promo');
});

test('options updates diagnostics summary when local storage change arrives', async () => {
  const harness = createHarness();
  await harness.runOptions();

  await harness.emitLocalDiagnostics({
    updatedAt: Date.now(),
    host: 'rozetka.com.ua',
    features: [
      {
        id: 'smart-delivery-badge',
        status: 'ok',
        selectorMatches: 1,
        textMatch: null,
        hiddenCount: 1
      },
      {
        id: 'email-subscription-banner',
        status: 'warning',
        selectorMatches: 1,
        textMatch: null,
        hiddenCount: 0
      }
    ]
  });

  const summary = harness.getById('diagnosticsSummary');
  assert.ok(summary.textContent.includes('варто перевірити'));
});

test('options saves global enabled toggle', async () => {
  const harness = createHarness({ syncSettings: { enabled: true } });
  await harness.runOptions();

  const enabledToggle = harness.getById('extensionEnabled');
  assert.equal(enabledToggle.checked, true);

  enabledToggle.checked = false;
  enabledToggle.dispatch('change');

  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.enabled, false);
});

test('options clears pauseUntil when global enabled toggle changes', async () => {
  const harness = createHarness({
    syncSettings: {
      enabled: false,
      pauseUntil: 9999999999999
    }
  });
  await harness.runOptions();

  const enabledToggle = harness.getById('extensionEnabled');
  enabledToggle.checked = true;
  enabledToggle.dispatch('change');

  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.enabled, true);
  assert.equal(lastCall.rzc_settings.pauseUntil, 0);
});

test('recommended settings button enables extension and applies defaults', async () => {
  const harness = createHarness({
    syncSettings: {
      enabled: false,
      hideAdvertisingSections: false,
      hidePromoLabels: false,
      hideProductPictograms: false,
      hideBonusPoints: false,
      hideSmartDeliveryBadge: false,
      hideSuperOffer: false,
      hideProductServices: false,
      hideStickyProductCarriage: false,
      hidePromotionProduct: false
    }
  });
  await harness.runOptions();

  const button = harness.getById('applyRecommendedSettings');
  button.dispatch('click');

  const lastCall = harness.syncSetCalls[harness.syncSetCalls.length - 1];
  assert.equal(lastCall.rzc_settings.enabled, true);
  assert.equal(lastCall.rzc_settings.hideAdvertisingSections, true);
  assert.equal(lastCall.rzc_settings.hidePromoLabels, true);
  assert.equal(lastCall.rzc_settings.hideProductPictograms, true);
  assert.equal(lastCall.rzc_settings.hideBonusPoints, true);
  assert.equal(lastCall.rzc_settings.hideSmartDeliveryBadge, true);
  assert.equal(lastCall.rzc_settings.hideSuperOffer, true);
  assert.equal(lastCall.rzc_settings.hideProductServices, true);
  assert.equal(lastCall.rzc_settings.hideStickyProductCarriage, true);
  assert.equal(lastCall.rzc_settings.hidePromotionProduct, true);
});

test('run diagnostics now opens diagnostics section', async () => {
  const harness = createHarness({ diagnostics: { features: [], updatedAt: Date.now() } });
  await harness.runOptions();

  assert.equal(harness.diagnosticsDetails.open, false);
  const runBtn = harness.getById('runDiagnosticsNow');
  runBtn.dispatch('click');
  assert.equal(harness.diagnosticsDetails.open, true);
});

test('copy active selectors copies text and shows local status badge', async () => {
  const harness = createHarness();
  await harness.runOptions();

  const activeSelectors = harness.getById('activeSelectors');
  activeSelectors.value = 'rz-product-tile\\n.red-label';
  const copyBtn = harness.getById('copyActiveSelectors');
  await copyBtn.dispatch('click');

  assert.equal(harness.getCopiedText(), 'rz-product-tile\\n.red-label');
  const copyStatus = harness.getById('copyActiveSelectorsStatus');
  assert.equal(copyStatus.textContent, 'Скопійовано');
  assert.equal(copyStatus.classList.contains('visible'), true);
});
