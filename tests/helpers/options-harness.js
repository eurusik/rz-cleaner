const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const OPTIONS_SOURCE = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');

class FakeClassList {
  constructor() {
    this.set = new Set();
  }

  add(name) {
    this.set.add(name);
  }

  remove(name) {
    this.set.delete(name);
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
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.checked = false;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.classList = new FakeClassList();
    this.children = [];
    this.listeners = new Map();
  }

  addEventListener(type, cb) {
    const arr = this.listeners.get(type) || [];
    arr.push(cb);
    this.listeners.set(type, arr);
  }

  dispatch(type) {
    const arr = this.listeners.get(type) || [];
    arr.forEach((cb) => cb());
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

function createHarness({ syncSettings = {}, diagnostics = null } = {}) {
  const docListeners = new Map();
  const byId = new Map();
  const onChangedListeners = [];
  const syncSetCalls = [];
  let timerId = 0;

  const defaultsSandbox = { globalThis: {} };
  vm.createContext(defaultsSandbox);
  vm.runInContext(CONFIG_SOURCE, defaultsSandbox);
  const defaults = defaultsSandbox.globalThis.RZC_CONFIG.defaults || {};

  function ensure(id, tag = 'div') {
    if (!byId.has(id)) byId.set(id, new FakeElement(tag, id));
    return byId.get(id);
  }

  Object.keys(defaults).forEach((key) => {
    const tag = typeof defaults[key] === 'boolean' ? 'input' : 'textarea';
    ensure(key, tag);
  });

  ensure('status');
  ensure('activeSelectors', 'textarea');
  ensure('resetFallbackTexts', 'button');
  ensure('resetCustomSelectors', 'button');
  ensure('diagnosticsSummary');
  ensure('diagnosticsMeta');
  ensure('diagnosticsList', 'ul');
  ensure('refreshDiagnostics', 'button');

  const document = {
    getElementById(id) {
      return byId.get(id) || null;
    },
    createElement(tag) {
      return new FakeElement(tag);
    },
    addEventListener(type, cb) {
      const arr = docListeners.get(type) || [];
      arr.push(cb);
      docListeners.set(type, arr);
    },
    visibilityState: 'visible'
  };

  const window = {
    setTimeout(cb) {
      timerId += 1;
      cb();
      return timerId;
    },
    clearTimeout() {},
    addEventListener() {}
  };

  const chrome = {
    storage: {
      sync: {
        get(request, cb) {
          cb({ ...request, rzc_settings: { ...syncSettings } });
        },
        set(payload, cb) {
          syncSetCalls.push(payload);
          if (cb) cb();
        }
      },
      local: {
        get(request, cb) {
          cb({ ...request, rzc_settings_diagnostics: diagnostics });
        }
      },
      onChanged: {
        addListener(fn) {
          onChangedListeners.push(fn);
        },
        removeListener(fn) {
          const i = onChangedListeners.indexOf(fn);
          if (i >= 0) onChangedListeners.splice(i, 1);
        }
      }
    },
    runtime: { lastError: null }
  };

  const sandbox = { console, document, window, chrome, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(CONFIG_SOURCE, sandbox);

  async function runOptions() {
    vm.runInContext(OPTIONS_SOURCE, sandbox);
    await Promise.resolve();
    await Promise.resolve();
  }

  async function emitLocalDiagnostics(nextDiagnostics) {
    const change = {
      rzc_settings_diagnostics: {
        newValue: nextDiagnostics
      }
    };
    onChangedListeners.forEach((fn) => fn(change, 'local'));
    await Promise.resolve();
    await Promise.resolve();
  }

  return {
    getById: (id) => byId.get(id),
    syncSetCalls,
    runOptions,
    emitLocalDiagnostics
  };
}

module.exports = { createHarness };
