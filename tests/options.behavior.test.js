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
