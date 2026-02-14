const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/popup-harness');

test('popup loads quick toggle values from synced settings', async () => {
  const harness = createHarness({
    syncSettings: {
      enabled: true,
      hideAdvertisingSections: false,
      hidePromoBlocks: true,
      hideSmartDeliveryBadge: false,
      normalizePriceLayout: true
    }
  });

  await harness.runPopup();

  assert.equal(harness.getById('extensionEnabled').checked, true);
  assert.equal(harness.getById('hideAdvertisingSections').checked, false);
  assert.equal(harness.getById('hidePromoBlocks').checked, true);
  assert.equal(harness.getById('hideSmartDeliveryBadge').checked, false);
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

test('popup pause button sets pauseUntil in future and disables quick toggles', async () => {
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
