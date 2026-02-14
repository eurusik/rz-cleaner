const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const POPUP_SOURCE = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');

class FakeClassList {
  constructor() {
    this.set = new Set();
  }

  add(...names) {
    names.forEach((name) => this.set.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.set.delete(name));
  }

  toggle(name, force) {
    if (force === undefined) {
      if (this.set.has(name)) this.set.delete(name);
      else this.set.add(name);
      return;
    }
    if (force) this.set.add(name);
    else this.set.delete(name);
  }

  contains(name) {
    return this.set.has(name);
  }
}

class FakeElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = String(tagName).toUpperCase();
    this.id = id;
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.value = '';
    this.textContent = '';
    this.classList = new FakeClassList();
    this.listeners = new Map();
  }

  addEventListener(type, cb) {
    const list = this.listeners.get(type) || [];
    list.push(cb);
    this.listeners.set(type, list);
  }

  dispatch(type) {
    const list = this.listeners.get(type) || [];
    list.forEach((cb) => cb());
  }
}

function createHarness({ syncSettings = {}, activeTabUrl = '', diagnostics = null, tabContext = null } = {}) {
  const byId = new Map();
  const syncSetCalls = [];
  let timerId = 0;
  const TOGGLE_IDS = [
    'hideAdvertisingSections',
    'hidePromoBlocks',
    'hidePromoLabels',
    'hideProductPictograms',
    'hideRedBonusBlocks',
    'hideBonusPoints',
    'hideQuickFilters',
    'hideRozetkaAI',
    'hideAiConsultationBlock',
    'hidePopularSearchChips',
    'hideSmartDeliveryBadge',
    'hideEmailSubscriptionBanner',
    'hideSuperOffer',
    'hideProductServices',
    'hideStickyProductCarriage',
    'hidePromotionProduct',
    'enableTileGallery',
    'normalizePriceLayout'
  ];

  function ensure(id, tag = 'div') {
    if (!byId.has(id)) byId.set(id, new FakeElement(tag, id));
    return byId.get(id);
  }

  ensure('status');
  ensure('pauseInfo');
  ensure('extensionEnabled', 'input');
  ensure('disableOneHour', 'button');
  ensure('openOptions', 'button');
  TOGGLE_IDS.forEach((id) => ensure(id, 'input'));
  TOGGLE_IDS.forEach((id) => ensure(`row-${id}`, 'label'));

  const toggles = new FakeElement('section');
  toggles.className = 'toggles';
  let openOptionsCalls = 0;

  const document = {
    getElementById(id) {
      return byId.get(id) || null;
    },
    querySelector(selector) {
      if (selector === '.toggles') return toggles;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.toggles input[id]') {
        return TOGGLE_IDS.map((id) => byId.get(id)).filter(Boolean);
      }
      return [];
    }
  };

  const chrome = {
    storage: {
      sync: {
        get(request, cb) {
          cb({ ...request, rzc_settings: { ...syncSettings } });
        },
        set(payload, cb) {
          syncSetCalls.push(payload);
          if (typeof cb === 'function') cb();
        }
      },
      local: {
        get(request, cb) {
          cb({ ...request, rzc_settings_diagnostics: diagnostics });
        }
      }
    },
    runtime: {
      lastError: null,
      openOptionsPage() {
        openOptionsCalls += 1;
      }
    },
    tabs: {
      query(_queryInfo, cb) {
        cb(activeTabUrl ? [{ id: 1, active: true, url: activeTabUrl }] : []);
      },
      sendMessage(_tabId, _message, cb) {
        cb(tabContext);
      }
    }
  };

  const window = {
    setTimeout(cb) {
      timerId += 1;
      cb();
      return timerId;
    },
    close() {}
  };

  const sandbox = { console, document, chrome, window, Date };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CONFIG_SOURCE, sandbox);

  async function runPopup() {
    vm.runInContext(POPUP_SOURCE, sandbox);
    for (let i = 0; i < 30; i += 1) {
      await Promise.resolve();
    }
  }

  return {
    getById: (id) => byId.get(id),
    toggles,
    syncSetCalls,
    getOpenOptionsCalls: () => openOptionsCalls,
    runPopup
  };
}

module.exports = { createHarness };
