const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';

function loadConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  const sandbox = { globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.globalThis.RZC_CONFIG;
}

const html = fs.readFileSync(path.join(ROOT, 'options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');
const contentJs = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');

test('each boolean default has a checkbox in options.html', () => {
  const defaults = loadConfig().defaults;
  const booleanKeys = Object.keys(defaults).filter((k) => typeof defaults[k] === 'boolean');

  for (const key of booleanKeys) {
    assert.ok(html.includes(`id="${key}"`), `missing checkbox for ${key}`);
  }
});

test('each supported feature toggle has a mapping in options.js', () => {
  const requiredMappings = [
    'hidePromoBlocks',
    'hideRedBonusBlocks',
    'hideAdvertisingSections',
    'hideQuickFilters',
    'hideRozetkaAI',
    'hideAiConsultationBlock',
    'hidePopularSearchChips',
    'hideSmartDeliveryBadge',
    'hideEmailSubscriptionBanner'
  ];

  for (const settingKey of requiredMappings) {
    assert.ok(optionsJs.includes(`"${settingKey}"`) || optionsJs.includes(`: "${settingKey}"`), `missing mapping usage for ${settingKey}`);
  }
});

test('content cleanup pipeline includes all major hide steps', () => {
  const requiredCalls = [
    'hidePromoPrices(root, settings);',
    'hideRedBonusBlocks(root, settings);',
    'hideAdvertisingSections(root, settings);',
    'hideQuickFilters(root, settings);',
    'hideRozetkaAIWidget(root, settings);',
    'hideAiConsultationBlock(root, settings);',
    'hidePopularSearchChips(root, settings);',
    'hideSmartDeliveryBadge(root, settings);',
    'hideEmailSubscriptionBanner(root, settings);',
    'hideCustomSelectors(root, settings);'
  ];

  for (const call of requiredCalls) {
    assert.ok(contentJs.includes(call), `cleanup is missing: ${call}`);
  }
});
