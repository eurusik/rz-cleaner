(function () {
  "use strict";

  const bridgeProtocol = globalThis.RZCTileGalleryBridgeProtocol || {};
  const SOURCE = bridgeProtocol.SOURCE || "RZC_PAGE_BRIDGE";
  const TYPE = bridgeProtocol.TYPE || "RZC_TILE_GALLERY_PRODUCTS";
  const REQUEST_SOURCE = bridgeProtocol.REQUEST_SOURCE || "RZC_TILE_GALLERY_CONTENT";
  const REQUEST_TYPE = bridgeProtocol.REQUEST_TYPE || "RZC_TILE_GALLERY_REQUEST_SNAPSHOT";
  const MAX_CACHE_SIZE = 3000;
  const CACHE = new Map();
  const IMAGE_RE = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;

  function isObject(value) {
    return Boolean(value) && typeof value === "object";
  }

  function isImageUrl(url) {
    if (!url) return false;
    const normalized = String(url).trim();
    if (!normalized.startsWith("http")) return false;
    return IMAGE_RE.test(normalized);
  }

  function uniqueUrls(list, limit = 20) {
    const out = [];
    const seen = new Set();
    (list || []).forEach((value) => {
      const normalized = String(value || "").trim();
      if (!isImageUrl(normalized) || seen.has(normalized)) return;
      seen.add(normalized);
      out.push(normalized);
    });
    return out.slice(0, limit);
  }

  function normalizeProduct(node) {
    if (!isObject(node) || !node.id || !isObject(node.images)) return null;
    const all = Array.isArray(node.images.all) ? node.images.all : [];
    const urls = uniqueUrls([].concat(all, node.images.main || "", node.images.hover || ""));
    if (urls.length < 2) return null;
    return {
      id: String(node.id),
      images: {
        all: urls,
        main: urls[0] || "",
        hover: urls[1] || ""
      }
    };
  }

  function collectProducts(node, out, seen) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((item) => collectProducts(item, out, seen));
      return;
    }
    if (!isObject(node)) return;
    if (seen.has(node)) return;
    seen.add(node);

    const product = normalizeProduct(node);
    if (product) out.push(product);

    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      collectProducts(node[key], out, seen);
    }
  }

  function productsFromPayload(payload) {
    if (!payload) return [];
    const products = [];
    collectProducts(payload, products, new WeakSet());
    if (!products.length) return [];

    const deduped = [];
    const ids = new Set();
    products.forEach((product) => {
      if (!product || !product.id || ids.has(product.id)) return;
      ids.add(product.id);
      deduped.push(product);
    });
    return deduped;
  }

  function cacheProducts(products) {
    if (!Array.isArray(products) || !products.length) return;
    products.forEach((product) => {
      CACHE.set(product.id, product);
    });
    while (CACHE.size > MAX_CACHE_SIZE) {
      const firstKey = CACHE.keys().next().value;
      if (!firstKey) break;
      CACHE.delete(firstKey);
    }
  }

  function readCacheSnapshot() {
    return { data: Array.from(CACHE.values()) };
  }

  function postProducts(products) {
    if (!Array.isArray(products) || !products.length) return;
    cacheProducts(products);
    if (typeof window.postMessage !== "function") return;
    window.postMessage({ source: SOURCE, type: TYPE, payload: { data: products } }, "*");
  }

  function processPayload(payload) {
    const products = productsFromPayload(payload);
    if (!products.length) return;
    postProducts(products);
  }

  globalThis.__RZCPageBridgeTest__ = {
    isImageUrl,
    uniqueUrls,
    normalizeProduct,
    productsFromPayload
  };

  if (typeof window.addEventListener === "function") {
    window.addEventListener("message", (event) => {
      if (!event || !event.data) return;
      const data = event.data;
      if (data.source !== REQUEST_SOURCE || data.type !== REQUEST_TYPE) return;
      if (typeof window.postMessage !== "function") return;
      window.postMessage({ source: SOURCE, type: TYPE, payload: readCacheSnapshot() }, "*");
    });
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      try {
        const cloned = response && typeof response.clone === "function" ? response.clone() : null;
        const contentType =
          cloned && cloned.headers && typeof cloned.headers.get === "function"
            ? String(cloned.headers.get("content-type") || "").toLowerCase()
            : "";
        const looksJson = contentType.includes("application/json");
        if (cloned && looksJson && typeof cloned.json === "function") {
          cloned.json().then((payload) => processPayload(payload)).catch(() => {});
        }
      } catch (err) {}
      return response;
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (typeof OriginalXHR === "function") {
    const originalSend = OriginalXHR.prototype.send;

    OriginalXHR.prototype.send = function (...args) {
      this.addEventListener("load", function () {
        try {
          if (this.responseType === "json" && isObject(this.response)) {
            processPayload(this.response);
            return;
          }

          const contentType = this.getResponseHeader && this.getResponseHeader("content-type");
          const looksJson = contentType && contentType.toLowerCase().includes("application/json");
          const text = typeof this.responseText === "string" ? this.responseText : "";
          if (!text) return;
          if (!looksJson && !text.includes("\"images\"")) return;
          const payload = JSON.parse(text);
          processPayload(payload);
        } catch (err) {}
      });
      return originalSend.apply(this, args);
    };
  }
})();
