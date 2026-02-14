const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const CONTENT_SOURCES = [
  'dom-utils.js',
  'features/promo.js',
  'features/ads.js',
  'features/ai.js',
  'features/smart.js',
  'features/rich-content-spoiler.js',
  'diagnostics.js',
  'feature-registry.js',
  'content-core.js',
  'content.js'
].map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8'));

class FakeStyle {
  constructor() {
    this.values = new Map();
    this.priorities = new Map();
  }

  setProperty(prop, value, priority = '') {
    this.values.set(prop, String(value));
    this.priorities.set(prop, String(priority));
  }

  getPropertyValue(prop) {
    return this.values.get(prop) || '';
  }

  getPropertyPriority(prop) {
    return this.priorities.get(prop) || '';
  }

  removeProperty(prop) {
    this.values.delete(prop);
    this.priorities.delete(prop);
  }
}

class FakeClassList {
  constructor(initial = []) {
    this.set = new Set(initial);
  }

  add(...classes) {
    classes.forEach((name) => this.set.add(name));
  }

  remove(...classes) {
    classes.forEach((name) => this.set.delete(name));
  }

  contains(name) {
    return this.set.has(name);
  }
}

function matchesSimpleSelector(node, selector) {
  const raw = selector.trim();
  if (!raw) return false;

  const m = raw.match(/^([a-zA-Z0-9-]+)?((\.[a-zA-Z0-9_-]+)*)$/);
  if (!m) return false;

  const tag = m[1] ? m[1].toUpperCase() : null;
  const classPart = m[2] || '';
  const classNames = classPart
    .split('.')
    .map((v) => v.trim())
    .filter(Boolean);

  if (tag && node.tagName !== tag) return false;
  return classNames.every((className) => node.classList.contains(className));
}

function matchesAnySelector(node, selectorList) {
  return selectorList
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((selector) => matchesSimpleSelector(node, selector));
}

class FakeElement {
  constructor(tagName, options = {}) {
    this.nodeType = 1;
    this.tagName = String(tagName || 'div').toUpperCase();
    this.attributes = new Map();
    this.classList = new FakeClassList(options.classes || []);
    this.style = new FakeStyle();
    this.parentElement = null;
    this.children = [];
    this.textContent = options.textContent || '';
    this.__queryMap = new Map();
    this.listeners = new Map();
  }

  appendChild(child) {
    if (!child) return child;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setQueryResult(selector, nodes) {
    this.__queryMap.set(selector, Array.from(nodes || []));
  }

  querySelectorAll(selector) {
    return this.__queryMap.get(selector) || [];
  }

  addEventListener(type, cb) {
    const list = this.listeners.get(type) || [];
    list.push(cb);
    this.listeners.set(type, list);
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (matchesAnySelector(cur, selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }
}

class FakeDocument extends FakeElement {
  constructor() {
    super('document');
    this.nodeType = 9;
    this.documentElement = new FakeElement('html');
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  addEventListener() {}
}

function createHarness(initialSettings = {}) {
  const document = new FakeDocument();
  const allElements = new Set();
  const storageListeners = [];
  let syncSettings = { ...initialSettings };
  let lastObserver = null;
  let timerId = 0;

  class FakeMutationObserver {
    constructor(cb) {
      this.cb = cb;
      this.connected = false;
      lastObserver = this;
    }

    observe() {
      this.connected = true;
    }

    disconnect() {
      this.connected = false;
    }

    trigger(mutations) {
      this.cb(mutations);
    }
  }

  const window = {
    requestAnimationFrame: (cb) => {
      timerId += 1;
      cb();
      return timerId;
    },
    cancelAnimationFrame: () => {},
    setTimeout: (cb) => {
      timerId += 1;
      cb();
      return timerId;
    },
    clearTimeout: () => {},
    addEventListener: () => {},
    getComputedStyle: () => ({ position: 'static', zIndex: 'auto' })
  };

  const sandbox = {
    console,
    window,
    document,
    Node: { ELEMENT_NODE: 1 },
    MutationObserver: FakeMutationObserver,
    chrome: {
      storage: {
        sync: {
          get(defaults, cb) {
            const response = { ...defaults, rzc_settings: { ...syncSettings } };
            cb(response);
          }
        },
        onChanged: {
          addListener(fn) {
            storageListeners.push(fn);
          },
          removeListener(fn) {
            const i = storageListeners.indexOf(fn);
            if (i >= 0) storageListeners.splice(i, 1);
          }
        }
      },
      runtime: { lastError: null }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(CONFIG_SOURCE, sandbox);

  const baseQuerySelectorAll = document.querySelectorAll.bind(document);
  document.querySelectorAll = (selector) => {
    if (selector === '[data-rzc-hide-features]') {
      return Array.from(allElements).filter((el) => el.getAttribute('data-rzc-hide-features'));
    }
    if (
      selector.startsWith('[data-rzc-hide-features*="') &&
      selector.endsWith('"]')
    ) {
      const featureNeedle = selector.slice(26, -2);
      return Array.from(allElements).filter((el) => {
        const raw = el.getAttribute('data-rzc-hide-features') || '';
        return raw.includes(featureNeedle);
      });
    }
    return baseQuerySelectorAll(selector);
  };

  async function runContent() {
    CONTENT_SOURCES.forEach((source) => vm.runInContext(source, sandbox));
    await Promise.resolve();
    await Promise.resolve();
  }

  async function emitSettingsChange(nextSettings) {
    syncSettings = { ...nextSettings };
    const change = { rzc_settings: { newValue: { ...syncSettings } } };
    storageListeners.forEach((fn) => fn(change, 'sync'));
    await Promise.resolve();
    await Promise.resolve();
  }

  return {
    document,
    window,
    runContent,
    emitSettingsChange,
    getLastObserver: () => lastObserver,
    createElement: (tag, options) => {
      const el = new FakeElement(tag, options);
      allElements.add(el);
      return el;
    }
  };
}

module.exports = { createHarness };
