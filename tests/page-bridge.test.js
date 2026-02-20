const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = '/Users/eurusik/Documents/New project';
const protocolSource = fs.readFileSync(path.join(ROOT, 'tile-gallery-bridge-protocol.js'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(ROOT, 'page-bridge.js'), 'utf8');

function loadBridgeHarness() {
  const listeners = new Map();
  const sandbox = {
    console,
    window: {
      addEventListener(type, cb) {
        listeners.set(type, cb);
      },
      postMessage() {},
      fetch: undefined,
      XMLHttpRequest: undefined
    },
    JSON,
    URL
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(protocolSource, sandbox);
  vm.runInContext(bridgeSource, sandbox);
  return {
    testApi: sandbox.__RZCPageBridgeTest__,
    sandbox
  };
}

test('page-bridge normalizes product images and excludes non-image urls', () => {
  const { testApi: bridge } = loadBridgeHarness();
  const product = bridge.normalizeProduct({
    id: 123,
    images: {
      all: [
        'https://content.rozetka.com.ua/goods/images/original/1.jpg',
        'https://content.rozetka.com.ua/goods/images/original/1.jpg',
        'https://example.com/not-image'
      ],
      main: 'https://content.rozetka.com.ua/goods/images/original/2.webp',
      hover: ''
    }
  });

  assert.ok(product);
  assert.equal(product.id, '123');
  assert.deepEqual(Array.from(product.images.all), [
    'https://content.rozetka.com.ua/goods/images/original/1.jpg',
    'https://content.rozetka.com.ua/goods/images/original/2.webp'
  ]);
});

test('page-bridge productsFromPayload deduplicates by id and traverses nested payload', () => {
  const { testApi: bridge } = loadBridgeHarness();
  const products = bridge.productsFromPayload({
    data: [
      {
        id: 1,
        images: {
          all: [
            'https://content.rozetka.com.ua/goods/images/original/a.jpg',
            'https://content.rozetka.com.ua/goods/images/original/b.jpg'
          ]
        }
      },
      {
        item: {
          id: 1,
          images: {
            all: [
              'https://content.rozetka.com.ua/goods/images/original/c.jpg',
              'https://content.rozetka.com.ua/goods/images/original/d.jpg'
            ]
          }
        }
      },
      {
        id: 2,
        images: {
          all: ['https://content.rozetka.com.ua/goods/images/original/x.jpg'],
          main: 'https://content.rozetka.com.ua/goods/images/original/y.jpg'
        }
      }
    ]
  });

  assert.equal(products.length, 2);
  assert.equal(products[0].id, '1');
  assert.equal(products[1].id, '2');
});

test('page-bridge skips fetch body json parsing for non-json responses', async () => {
  let cloneCalls = 0;
  let jsonCalls = 0;
  const listeners = new Map();
  const originalFetchResponse = {
    clone() {
      cloneCalls += 1;
      return {
        headers: {
          get() {
            return 'text/html; charset=utf-8';
          }
        },
        json() {
          jsonCalls += 1;
          return Promise.resolve({});
        }
      };
    }
  };
  const sandbox = {
    console,
    window: {
      addEventListener(type, cb) {
        listeners.set(type, cb);
      },
      postMessage() {},
      fetch: async () => originalFetchResponse,
      XMLHttpRequest: undefined
    },
    JSON,
    URL
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(protocolSource, sandbox);
  vm.runInContext(bridgeSource, sandbox);

  await sandbox.window.fetch('https://rozetka.com.ua/api/v4/search/');
  await Promise.resolve();

  assert.equal(cloneCalls, 1);
  assert.equal(jsonCalls, 0);
});

test('page-bridge skips json parsing for non-product endpoints', async () => {
  let jsonCalls = 0;
  const listeners = new Map();
  const sandbox = {
    console,
    window: {
      addEventListener(type, cb) {
        listeners.set(type, cb);
      },
      postMessage() {},
      fetch: async () => ({
        url: 'https://rozetka.com.ua/ua/account/profile',
        clone() {
          return {
            headers: {
              get() {
                return 'application/json';
              }
            },
            json() {
              jsonCalls += 1;
              return Promise.resolve({ ok: true });
            }
          };
        }
      }),
      XMLHttpRequest: undefined
    },
    JSON,
    URL
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(protocolSource, sandbox);
  vm.runInContext(bridgeSource, sandbox);

  await sandbox.window.fetch('https://rozetka.com.ua/ua/account/profile');
  await Promise.resolve();

  assert.equal(jsonCalls, 0);
});
