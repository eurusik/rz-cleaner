(function () {
  "use strict";

  const READY_ATTR = "data-rzc-tile-gallery-ready";
  const URLS_ATTR = "data-rzc-tile-gallery-urls";
  const INDEX_ATTR = "data-rzc-tile-gallery-index";
  const HOST_ATTR = "data-rzc-tile-gallery-host";
  const BUTTON_ATTR = "data-rzc-tile-gallery-btn";
  const FETCHING_ATTR = "data-rzc-tile-gallery-fetching";
  const FETCH_BOUND_ATTR = "data-rzc-tile-gallery-fetch-bound";
  const FETCH_AUTO_ATTR = "data-rzc-tile-gallery-fetch-auto";
  const PRODUCT_ID_RE = /\/p(\d+)(?:\/|$)/i;
  const URL_RE = /https?:\/\/[^"'\\)\s>]+?\.(?:jpg|jpeg|png|webp|gif)/gi;
  const AUTO_REMOTE_FETCH_LIMIT = 24;
  const AUTO_REMOTE_FETCH_BASE_DELAY_MS = 220;
  const bridgeProtocol = globalThis.RZCTileGalleryBridgeProtocol || {};
  const CACHE = (globalThis.__RZC_TILE_GALLERY_CACHE__ = globalThis.__RZC_TILE_GALLERY_CACHE__ || new Map());
  const REMOTE_CACHE = (globalThis.__RZC_TILE_GALLERY_REMOTE_CACHE__ =
    globalThis.__RZC_TILE_GALLERY_REMOTE_CACHE__ || new Map());
  const BRIDGE_EVENT = bridgeProtocol.TYPE || "RZC_TILE_GALLERY_PRODUCTS";
  const BRIDGE_SOURCE = bridgeProtocol.SOURCE || "RZC_PAGE_BRIDGE";
  const BRIDGE_REQUEST_SOURCE = bridgeProtocol.REQUEST_SOURCE || "RZC_TILE_GALLERY_CONTENT";
  const BRIDGE_REQUEST_TYPE = bridgeProtocol.REQUEST_TYPE || "RZC_TILE_GALLERY_REQUEST_SNAPSHOT";
  const PRELOAD_STATE = (globalThis.__RZC_TILE_GALLERY_PRELOAD_STATE__ =
    globalThis.__RZC_TILE_GALLERY_PRELOAD_STATE__ || new Map());
  const STATS = (globalThis.__RZC_TILE_GALLERY_STATS__ =
    globalThis.__RZC_TILE_GALLERY_STATS__ || {
      cacheHits: 0,
      cacheMisses: 0,
      bridgeMessages: 0,
      tilesPrepared: 0,
      lastUpdatedAt: 0,
      clickCount: 0,
      loadSettled: 0
    });
  const EVENTS = (globalThis.__RZC_TILE_GALLERY_EVENTS__ =
    globalThis.__RZC_TILE_GALLERY_EVENTS__ || []);
  const DEBUG = (globalThis.__RZC_TILE_GALLERY_DEBUG__ =
    globalThis.__RZC_TILE_GALLERY_DEBUG__ || {
      logsEnabled: false
    });
  let bridgeInstalled = false;
  let lastCtx = null;
  let autoRemoteFetchScheduled = 0;

  function log(message, data) {
    if (!DEBUG.logsEnabled || typeof console === "undefined") return;
    if (typeof console.debug === "function") {
      console.debug(`[RZC tile-gallery] ${message}`, data || "");
      return;
    }
    if (typeof console.log === "function") {
      console.log(`[RZC tile-gallery] ${message}`, data || "");
    }
  }

  function pushEvent(type, payload) {
    EVENTS.push({
      at: Date.now(),
      type,
      ...(payload || {})
    });
    if (EVENTS.length > 100) EVENTS.splice(0, EVENTS.length - 100);
    log(type, payload);
  }

  function canPreloadImages() {
    return typeof window !== "undefined" && typeof window.Image === "function";
  }

  function uniqueNonEmpty(list, limit = 20) {
    const seen = new Set();
    const result = [];
    (list || []).forEach((value) => {
      const normalized = String(value || "").trim();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      result.push(normalized);
    });
    return result.slice(0, limit);
  }

  function isProductImageUrl(url) {
    if (!url) return false;
    const normalized = String(url).toLowerCase();
    if (!normalized.startsWith("http")) return false;
    if (!normalized.includes("/goods/images/")) return false;
    if (normalized.includes("/goods_tags/")) return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(normalized);
  }

  function toTileSizedUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "";
    if (!raw.includes("/goods/images/")) return raw;
    return raw.replace("/goods/images/original/", "/goods/images/big_tile/");
  }

  function toDisplayUrls(urls) {
    return uniqueNonEmpty((urls || []).map((url) => toTileSizedUrl(url)));
  }

  function parseSrcset(raw) {
    if (!raw) return [];
    return String(raw)
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean);
  }

  function toAbsoluteUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    const base =
      (typeof location !== "undefined" && location && location.href) ||
      (typeof window !== "undefined" && window.location && window.location.href) ||
      "https://rozetka.com.ua/";
    try {
      return new URL(value, base).toString();
    } catch (_error) {
      return value;
    }
  }

  function extractUrlsFromText(raw) {
    if (!raw) return [];
    const text = String(raw);
    const matched = text.match(URL_RE);
    return matched ? matched : [];
  }

  function collectUrlsFromAttributes(node) {
    if (!node || typeof node.getAttributeNames !== "function") return [];
    const urls = [];
    node.getAttributeNames().forEach((name) => {
      const value = node.getAttribute(name);
      if (!value) return;
      extractUrlsFromText(value).forEach((url) => urls.push(url));
      if (name.includes("srcset")) {
        parseSrcset(value).forEach((url) => urls.push(url));
      }
    });
    return urls;
  }

  function collectImgUrls(img) {
    if (!img || typeof img.getAttribute !== "function") return [];
    const candidates = [];
    [
      "src",
      "data-src",
      "data-lazy-src",
      "data-original",
      "data-hover",
      "data-hover-src",
      "data-hover-image",
      "ng-reflect-ng-src"
    ].forEach((attr) => {
      const value = img.getAttribute(attr);
      if (value) candidates.push(value);
    });

    [
      "srcset",
      "data-srcset",
      "data-lazy-srcset"
    ].forEach((attr) => {
      parseSrcset(img.getAttribute(attr)).forEach((url) => candidates.push(url));
    });

    collectUrlsFromAttributes(img).forEach((url) => candidates.push(url));
    return candidates;
  }

  function findPrimaryImage(ctx, tile) {
    const selectors = [
      "a.tile-image-host img.tile-image",
      "a.tile-image-host img",
      "img.tile-image",
      "a img",
      "img"
    ];
    for (let i = 0; i < selectors.length; i += 1) {
      const list = ctx.safeQueryAll(tile, selectors[i]);
      if (list && list.length) return list[0];
    }
    return null;
  }

  function findImageHost(ctx, tile, primaryImg) {
    const directTileHost = ctx.safeQueryAll(tile, "a.tile-image-host");
    if (directTileHost && directTileHost.length) return directTileHost[0];

    if (primaryImg) {
      const explicitHost = ctx.safeClosest(primaryImg, "a.tile-image-host");
      if (explicitHost) return explicitHost;
      const linkHost = ctx.safeClosest(primaryImg, "a");
      if (linkHost) return linkHost;
    }
    return tile;
  }

  function readProductId(tile) {
    const links = [];
    function pushHref(node) {
      if (!node || typeof node.getAttribute !== "function") return;
      const href = node.getAttribute("href");
      if (href) links.push(href);
    }

    if (tile && typeof tile.querySelectorAll === "function") {
      // Priority: main image link and title link point to the canonical tile item.
      const imageHostLinks = tile.querySelectorAll("a.tile-image-host[href]");
      (imageHostLinks || []).forEach((node) => pushHref(node));

      const titleLinks = tile.querySelectorAll("a.tile-title[href]");
      (titleLinks || []).forEach((node) => pushHref(node));

      const activeColorLinks = tile.querySelectorAll("rz-tile-colors a.active[href]");
      (activeColorLinks || []).forEach((node) => pushHref(node));

      const anchors = tile.querySelectorAll("a[href]");
      (anchors || []).forEach((node) => pushHref(node));
    }

    if (tile && typeof tile.getAttribute === "function") {
      pushHref(tile);
    }

    for (let i = 0; i < links.length; i += 1) {
      const match = String(links[i]).match(PRODUCT_ID_RE);
      if (match && match[1]) return match[1];
    }
    return "";
  }

  function readProductHref(tile) {
    const hrefs = [];

    function pushHref(node) {
      if (!node || typeof node.getAttribute !== "function") return;
      const href = String(node.getAttribute("href") || "").trim();
      if (!href) return;
      hrefs.push(toAbsoluteUrl(href));
    }

    if (tile && typeof tile.querySelectorAll === "function") {
      const imageHostLinks = tile.querySelectorAll("a.tile-image-host[href]");
      (imageHostLinks || []).forEach((node) => pushHref(node));

      const titleLinks = tile.querySelectorAll("a.tile-title[href]");
      (titleLinks || []).forEach((node) => pushHref(node));

      const anyProductLinks = tile.querySelectorAll("a[href*='/p']");
      (anyProductLinks || []).forEach((node) => pushHref(node));
    }

    for (let i = 0; i < hrefs.length; i += 1) {
      const href = hrefs[i];
      if (PRODUCT_ID_RE.test(href)) return href;
    }
    return hrefs[0] || "";
  }

  function fetchProductUrls(productId, href) {
    const key = productId || href;
    if (!key || !href || typeof fetch !== "function") return Promise.resolve([]);

    if (REMOTE_CACHE.has(key)) return REMOTE_CACHE.get(key);

    const inflight = fetch(href, { credentials: "include" })
      .then((response) => {
        if (!response || !response.ok || typeof response.text !== "function") return "";
        return response.text();
      })
      .then((html) => {
        if (!html) return [];
        return toDisplayUrls(uniqueNonEmpty(extractUrlsFromText(html).filter(isProductImageUrl), 40))
          .filter(isProductImageUrl);
      })
      .catch(() => [])
      .then((urls) => {
        const safeUrls = Array.isArray(urls) ? urls : [];
        if (safeUrls.length >= 2) {
          if (productId) CACHE.set(productId, { urls: safeUrls });
          REMOTE_CACHE.set(key, Promise.resolve(safeUrls));
          return safeUrls;
        }
        // Do not keep negative cache forever. Retry is allowed on next hover/touch.
        REMOTE_CACHE.delete(key);
        return safeUrls;
      });

    REMOTE_CACHE.set(key, inflight);
    return inflight;
  }

  function unbindRemoteFallback(tile) {
    if (!tile || tile.nodeType !== Node.ELEMENT_NODE) return;
    const bindings = tile.__rzcRemoteFetchBindings;
    if (!bindings || typeof bindings.triggerFetch !== "function" || !Array.isArray(bindings.nodes)) {
      tile.removeAttribute(FETCH_BOUND_ATTR);
      return;
    }

    bindings.nodes.forEach((node) => {
      if (!node || typeof node.removeEventListener !== "function") return;
      node.removeEventListener("mouseenter", bindings.triggerFetch);
      node.removeEventListener("touchstart", bindings.triggerFetch);
    });
    tile.__rzcRemoteFetchBindings = null;
    tile.removeAttribute(FETCH_BOUND_ATTR);
  }

  function isNearViewport(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") return true;
    if (typeof window === "undefined") return true;
    const rect = node.getBoundingClientRect();
    const viewportHeight =
      Number(window.innerHeight || 0) ||
      (typeof document !== "undefined" &&
        document.documentElement &&
        Number(document.documentElement.clientHeight || 0)) ||
      0;
    if (!viewportHeight) return true;
    return rect.bottom >= -180 && rect.top <= viewportHeight + 360;
  }

  function bindRemoteFallback(ctx, tile, host, productId, href) {
    if (!tile || tile.nodeType !== Node.ELEMENT_NODE) return;
    if (!href) return;
    if (tile.__rzcRemoteFetchBindings) return;
    if (tile.getAttribute(FETCH_BOUND_ATTR) === "1") {
      tile.removeAttribute(FETCH_BOUND_ATTR);
    }

    const triggerFetch = () => {
      if (tile.getAttribute(READY_ATTR) === "1") return;
      if (tile.getAttribute(FETCHING_ATTR) === "1") return;
      tile.setAttribute(FETCHING_ATTR, "1");
      pushEvent("remote-fetch-start", { productId, href });

      fetchProductUrls(productId, href)
        .then((urls) => {
          if (!Array.isArray(urls) || urls.length < 2) {
            pushEvent("remote-fetch-empty", { productId });
            return;
          }
          writeUrls(tile, urls);
          setupTileGallery(ctx, tile);
        })
        .finally(() => {
          tile.removeAttribute(FETCHING_ATTR);
        });
    };

    tile.setAttribute(FETCH_BOUND_ATTR, "1");
    const triggerNodes = [tile];
    if (host && host !== tile) triggerNodes.push(host);
    triggerNodes.forEach((node) => {
      if (!node || typeof node.addEventListener !== "function") return;
      node.addEventListener("mouseenter", triggerFetch);
      node.addEventListener("touchstart", triggerFetch, { passive: true });
    });
    tile.__rzcRemoteFetchBindings = {
      triggerFetch,
      nodes: triggerNodes
    };

    if (autoRemoteFetchScheduled < AUTO_REMOTE_FETCH_LIMIT && tile.getAttribute(FETCH_AUTO_ATTR) !== "1") {
      autoRemoteFetchScheduled += 1;
      tile.setAttribute(FETCH_AUTO_ATTR, "1");
      if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
        window.setTimeout(
          () => {
            if (tile.getAttribute(READY_ATTR) === "1") return;
            if (!isNearViewport(tile)) return;
            triggerFetch();
          },
          AUTO_REMOTE_FETCH_BASE_DELAY_MS + autoRemoteFetchScheduled * 20
        );
      }
    }
  }

  function productUrlsFromCache(productId) {
    if (!productId) return [];
    const entry = CACHE.get(productId);
    if (!entry || !Array.isArray(entry.urls)) {
      STATS.cacheMisses += 1;
      log("cache-miss", { productId, cacheSize: CACHE.size });
      return [];
    }
    STATS.cacheHits += 1;
    log("cache-hit", { productId, count: entry.urls.length });
    return entry.urls;
  }

  function walkProducts(node, consume) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item) => walkProducts(item, consume));
      return;
    }

    if (node.images && (node.images.all || node.images.main || node.images.hover)) {
      consume(node);
    }

    Object.keys(node).forEach((key) => walkProducts(node[key], consume));
  }

  function cacheProductsFromPayload(payload) {
    walkProducts(payload, (product) => {
      const id = product && product.id ? String(product.id) : "";
      if (!id) return;
      const urls = uniqueNonEmpty([
        ...(Array.isArray(product.images && product.images.all) ? product.images.all : []),
        product.images && product.images.main,
        product.images && product.images.hover
      ])
        .filter(isProductImageUrl);
      const displayUrls = toDisplayUrls(urls).filter(isProductImageUrl);
      if (displayUrls.length < 2) return;
      CACHE.set(id, { urls: displayUrls });
      STATS.lastUpdatedAt = Date.now();
      log("cache-set", { productId: id, count: displayUrls.length, cacheSize: CACHE.size });
    });
  }

  function installPageBridge() {
    if (bridgeInstalled) return;
    bridgeInstalled = true;

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("message", (event) => {
        if (!event || !event.data) return;
        const data = event.data;
        if (data.source !== BRIDGE_SOURCE || data.type !== BRIDGE_EVENT) return;
        STATS.bridgeMessages += 1;
        log("bridge-message", {
          bridgeMessages: STATS.bridgeMessages,
          payloadItems: Array.isArray(data.payload && data.payload.data) ? data.payload.data.length : 0
        });
        cacheProductsFromPayload(data.payload);
        if (lastCtx) applyTileGalleries(lastCtx, document);
      });

      if (typeof window.postMessage === "function") {
        log("bridge-snapshot-request");
        window.postMessage(
          { source: BRIDGE_REQUEST_SOURCE, type: BRIDGE_REQUEST_TYPE },
          "*"
        );
      }
    }
  }

  function readUrls(tile) {
    const raw = tile.getAttribute(URLS_ATTR) || "";
    if (!raw) return [];
    return raw.split("\n").map((value) => value.trim()).filter(Boolean);
  }

  function writeUrls(tile, urls) {
    tile.setAttribute(URLS_ATTR, urls.join("\n"));
  }

  function setCurrentImage(img, url) {
    if (!img || !url) return;
    if (typeof img.setAttribute === "function") img.setAttribute("src", url);
    try {
      img.src = url;
    } catch (err) {}
  }

  function wrapIndex(index, length) {
    if (!length) return 0;
    return (index % length + length) % length;
  }

  function setHostLoading(state, loading) {
    if (!state || !state.host) return;
    if (loading) {
      state.host.classList.add("rzc-tile-gallery-loading");
    } else {
      state.host.classList.remove("rzc-tile-gallery-loading");
    }
  }

  function preloadUrl(url) {
    if (!url || !canPreloadImages()) return null;
    const existing = PRELOAD_STATE.get(url);
    if (existing && existing.status === "loaded") return Promise.resolve();
    if (existing && existing.promise) return existing.promise;

    const img = new window.Image();
    const promise = new Promise((resolve) => {
      const done = () => {
        PRELOAD_STATE.set(url, { status: "loaded", promise: Promise.resolve() });
        resolve();
      };
      img.onload = done;
      img.onerror = done;
      img.src = url;
    });

    PRELOAD_STATE.set(url, { status: "loading", promise });
    return promise;
  }

  function preloadAround(state) {
    if (!state || !Array.isArray(state.urls) || state.urls.length < 2) return;
    const nextIdx = wrapIndex(state.currentIndex + 1, state.urls.length);
    const prevIdx = wrapIndex(state.currentIndex - 1, state.urls.length);
    preloadUrl(state.urls[nextIdx]);
    preloadUrl(state.urls[prevIdx]);
  }

  function preloadBatch(urls, limit = 10) {
    if (!Array.isArray(urls) || !urls.length) return;
    const slice = urls.slice(0, limit);
    slice.forEach((url) => {
      preloadUrl(url);
    });
  }

  function ensureCounter(state) {
    if (!state || !state.host || !state.tile || typeof document === "undefined") return null;
    if (state.counterEl) return state.counterEl;
    const counter = document.createElement("div");
    counter.className = "rzc-tile-gallery-counter";
    state.host.appendChild(counter);
    state.counterEl = counter;
    return counter;
  }

  function updateCounter(state) {
    const counter = ensureCounter(state);
    if (!counter || !Array.isArray(state.urls)) return;
    const current = wrapIndex(state.currentIndex, state.urls.length) + 1;
    counter.textContent = `${current}/${state.urls.length}`;
  }

  function applyIndex(state, index) {
    const nextIndex = wrapIndex(index, state.urls.length);
    state.currentIndex = nextIndex;
    state.tile.setAttribute(INDEX_ATTR, String(nextIndex));
    setCurrentImage(state.primaryImg, state.urls[nextIndex]);
    updateCounter(state);
    preloadAround(state);
  }

  function waitForImageSettled(state, expectedUrl) {
    return new Promise((resolve) => {
      if (!state || !state.primaryImg || typeof state.primaryImg.addEventListener !== "function") {
        resolve();
        return;
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (typeof state.primaryImg.removeEventListener === "function") {
          state.primaryImg.removeEventListener("load", onLoad);
          state.primaryImg.removeEventListener("error", onError);
        }
        resolve();
      };
      const onLoad = () => {
        const currentSrc = String(state.primaryImg.getAttribute("src") || "");
        if (!expectedUrl || currentSrc === expectedUrl) {
          pushEvent("image-load", { productId: state.productId, url: expectedUrl });
          finish();
        }
      };
      const onError = () => {
        pushEvent("image-error", { productId: state.productId, url: expectedUrl });
        finish();
      };
      const scheduleTimeout =
        typeof window !== "undefined" && typeof window.setTimeout === "function"
          ? window.setTimeout.bind(window)
          : typeof setTimeout === "function"
            ? setTimeout
            : null;

      state.primaryImg.addEventListener("load", onLoad);
      state.primaryImg.addEventListener("error", onError);
      if (scheduleTimeout) {
        scheduleTimeout(finish, 1200);
      } else {
        finish();
      }
    });
  }

  function queueShift(tile, step) {
    const state = tile && tile.__rzcGalleryState;
    if (!state || !Array.isArray(state.urls) || state.urls.length < 2) return;

    if (!state.warmPreloadStarted) {
      state.warmPreloadStarted = true;
      preloadBatch(state.urls, 12);
      pushEvent("warm-preload-start", { productId: state.productId, limit: 12 });
    }

    const nextIndex = wrapIndex(state.currentIndex + step, state.urls.length);
    const targetUrl = state.urls[nextIndex];
    state.loading = true;
    setHostLoading(state, true);
    STATS.clickCount += 1;
    pushEvent("click-switch", {
      productId: state.productId,
      from: state.currentIndex,
      to: nextIndex,
      url: targetUrl
    });

    applyIndex(state, nextIndex);
    preloadUrl(targetUrl);

    const token = (state.loadToken = (state.loadToken || 0) + 1);
    waitForImageSettled(state, targetUrl).finally(() => {
      if (state.loadToken !== token) return;
      state.loading = false;
      STATS.loadSettled += 1;
      setHostLoading(state, false);
      pushEvent("load-settled", {
        productId: state.productId,
        index: state.currentIndex,
        url: state.urls[state.currentIndex]
      });
    });
  }

  function makeArrow(direction) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rzc-tile-gallery-arrow rzc-tile-gallery-arrow-${direction}`;
    button.setAttribute(BUTTON_ATTR, direction);
    button.setAttribute("aria-label", direction === "prev" ? "Попереднє фото" : "Наступне фото");
    button.textContent = direction === "prev" ? "‹" : "›";
    return button;
  }

  function removeNode(node) {
    if (!node) return;
    if (typeof node.remove === "function") {
      node.remove();
      return;
    }
    const parent = node.parentElement;
    if (!parent || !Array.isArray(parent.children)) return;
    const idx = parent.children.indexOf(node);
    if (idx >= 0) parent.children.splice(idx, 1);
  }

  function maybeRefreshReadyTileFromCache(tile) {
    const state = tile && tile.__rzcGalleryState;
    if (!state || !Array.isArray(state.urls) || state.urls.length < 2) return false;

    // Only retry cache hydration when the bridge delivered new data.
    if (state.lastBridgeCheck === STATS.bridgeMessages) return true;
    state.lastBridgeCheck = STATS.bridgeMessages;

    if (!state.productId) return true;

    const cachedProductUrls = productUrlsFromCache(state.productId);
    const cacheUrls = uniqueNonEmpty(cachedProductUrls.filter(isProductImageUrl));
    if (cacheUrls.length < 2) return true;
    if (state.urls.length >= cacheUrls.length) return true;

    state.urls = cacheUrls;
    writeUrls(tile, cacheUrls);
    state.currentIndex = wrapIndex(state.currentIndex, cacheUrls.length);
    tile.setAttribute(INDEX_ATTR, String(state.currentIndex));
    updateCounter(state);
    preloadAround(state);
    log("tile-urls-updated", {
      productId: state.productId,
      count: cacheUrls.length
    });
    return true;
  }

  function setupTileGallery(ctx, tile) {
    if (!tile || tile.nodeType !== Node.ELEMENT_NODE) return;
    const hasReadyMarker = tile.getAttribute(READY_ATTR) === "1";
    if (hasReadyMarker) maybeRefreshReadyTileFromCache(tile);

    const primaryImg = findPrimaryImage(ctx, tile);
    if (!primaryImg) return;

    const host = findImageHost(ctx, tile, primaryImg);
    const imgNodes = ctx.safeQueryAll(host, "img");
    const collected = [];
    imgNodes.forEach((img) => {
      collectImgUrls(img).forEach((url) => collected.push(url));
    });
    if (!imgNodes.length) {
      collectImgUrls(primaryImg).forEach((url) => collected.push(url));
    }

    collectUrlsFromAttributes(host).forEach((url) => collected.push(url));
    collectUrlsFromAttributes(tile).forEach((url) => collected.push(url));

    const productId = readProductId(tile);
    const cachedProductUrls = productUrlsFromCache(productId);
    cachedProductUrls.forEach((url) => collected.push(url));
    const cacheUrls = uniqueNonEmpty(cachedProductUrls.filter(isProductImageUrl));
    const urls =
      cacheUrls.length >= 2
        ? cacheUrls
        : toDisplayUrls(uniqueNonEmpty(collected.filter(isProductImageUrl)));
    if (urls.length < 2) {
      bindRemoteFallback(ctx, tile, host, productId, readProductHref(tile));
      return;
    }
    unbindRemoteFallback(tile);
    log("tile-urls-ready", {
      productId,
      fromCache: cacheUrls.length >= 2,
      count: urls.length
    });

    tile.__rzcPrimaryImg = primaryImg;
    writeUrls(tile, urls);
    STATS.tilesPrepared += 1;

    const currentSrc = primaryImg.getAttribute("src") || "";
    const existingIdx = Number(tile.getAttribute(INDEX_ATTR) || "");
    const srcIdx = urls.indexOf(currentSrc);
    const initialIndex = Number.isFinite(existingIdx)
      ? wrapIndex(existingIdx, urls.length)
      : srcIdx >= 0
        ? srcIdx
        : 0;
    tile.setAttribute(INDEX_ATTR, String(initialIndex));

    tile.__rzcGalleryState = {
      tile,
      host,
      primaryImg,
      productId,
      urls,
      currentIndex: initialIndex,
      loading: false,
      loadToken: 0,
      warmPreloadStarted: false,
      lastBridgeCheck: STATS.bridgeMessages,
      counterEl: null
    };
    updateCounter(tile.__rzcGalleryState);
    preloadAround(tile.__rzcGalleryState);

    if (hasReadyMarker) {
      const existingButtons = ctx.safeQueryAll(host, `[${BUTTON_ATTR}]`);
      if (existingButtons.length >= 2) return;
      ctx.safeQueryAll(tile, `[${BUTTON_ATTR}]`).forEach((btn) => removeNode(btn));
      ctx.safeQueryAll(tile, `.rzc-tile-gallery-counter`).forEach((counter) => removeNode(counter));
    }

    host.classList.add("rzc-tile-gallery-host");
    host.setAttribute(HOST_ATTR, "1");

    const prev = makeArrow("prev");
    const next = makeArrow("next");

    prev.addEventListener("click", (event) => {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      queueShift(tile, -1);
    });
    next.addEventListener("click", (event) => {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      queueShift(tile, 1);
    });

    host.appendChild(prev);
    host.appendChild(next);

    host.addEventListener("mouseenter", () => {
      const state = tile.__rzcGalleryState;
      if (!state || state.warmPreloadStarted) return;
      state.warmPreloadStarted = true;
      preloadBatch(state.urls, 12);
      pushEvent("warm-preload-hover", { productId: state.productId, limit: 12 });
    });
    tile.setAttribute(READY_ATTR, "1");
  }

  function applyTileGalleries(ctx, root) {
    installPageBridge();
    const scope = root && root.querySelectorAll ? root : document;
    ctx.safeQueryAll(scope, "rz-product-tile").forEach((tile) => setupTileGallery(ctx, tile));
  }

  function removeTileGalleries(ctx, root) {
    const scope = root && root.querySelectorAll ? root : document;
    ctx.safeQueryAll(scope, "rz-product-tile").forEach((tile) => {
      unbindRemoteFallback(tile);
      tile.removeAttribute(READY_ATTR);
      tile.removeAttribute(URLS_ATTR);
      tile.removeAttribute(INDEX_ATTR);
      tile.removeAttribute(FETCHING_ATTR);
      tile.removeAttribute(FETCH_BOUND_ATTR);
      tile.removeAttribute(FETCH_AUTO_ATTR);
      tile.__rzcPrimaryImg = null;
      tile.__rzcGalleryState = null;

      ctx.safeQueryAll(tile, `[${BUTTON_ATTR}]`).forEach((btn) => removeNode(btn));
      ctx.safeQueryAll(tile, `.rzc-tile-gallery-counter`).forEach((counter) => removeNode(counter));
      ctx.safeQueryAll(tile, `[${HOST_ATTR}]`).forEach((host) => {
        host.classList.remove("rzc-tile-gallery-host");
        host.removeAttribute(HOST_ATTR);
      });
    });
  }

  function run(ctx, root, settings) {
    lastCtx = ctx;
    if (settings && settings.enableTileGallery === false) {
      removeTileGalleries(ctx, root);
      return;
    }
    applyTileGalleries(ctx, root);
  }

  function onDisabled(ctx, root) {
    removeTileGalleries(ctx, root);
  }

  function diagnostics(ctx, settings, scope, extensionEnabled) {
    return [
      {
        id: "tile-gallery",
        enabled: extensionEnabled && Boolean(settings.enableTileGallery),
        selectorMatches: ctx.countUniqueMatchesBySelectors(scope, ["rz-product-tile"]),
        textMatch: null,
        statusMode: "presence"
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.tileGallery = {
    run,
    onDisabled,
    diagnostics,
    applyTileGalleries,
    removeTileGalleries
  };

  globalThis.RZCTileGalleryDebug = {
    getStats() {
      return {
        ...STATS,
        cacheSize: CACHE.size,
        recentEvents: EVENTS.slice(-20)
      };
    },
    resetStats() {
      STATS.cacheHits = 0;
      STATS.cacheMisses = 0;
      STATS.bridgeMessages = 0;
      STATS.tilesPrepared = 0;
      STATS.lastUpdatedAt = 0;
      STATS.clickCount = 0;
      STATS.loadSettled = 0;
      EVENTS.length = 0;
    },
    enableLogs() {
      DEBUG.logsEnabled = true;
    },
    disableLogs() {
      DEBUG.logsEnabled = false;
    }
  };
})();
