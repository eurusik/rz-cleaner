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

function createHarness({ syncSettings = {} } = {}) {
  const byId = new Map();
  const syncSetCalls = [];
  let timerId = 0;

  function ensure(id, tag = 'div') {
    if (!byId.has(id)) byId.set(id, new FakeElement(tag, id));
    return byId.get(id);
  }

  ensure('status');
  ensure('pauseInfo');
  ensure('extensionEnabled', 'input');
  ensure('disableOneHour', 'button');
  ensure('openOptions', 'button');
  ensure('hideAdvertisingSections', 'input');
  ensure('hidePromoBlocks', 'input');
  ensure('hideSmartDeliveryBadge', 'input');
  ensure('normalizePriceLayout', 'input');

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
      }
    },
    runtime: {
      lastError: null,
      openOptionsPage() {
        openOptionsCalls += 1;
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
    await Promise.resolve();
    await Promise.resolve();
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
