(function () {
  "use strict";

  function init() {
    if (globalThis.__RZC_CONTENT_INIT__) return;
    globalThis.__RZC_CONTENT_INIT__ = true;

  const HIDDEN_ATTR = "data-rz-clean-hidden";
  const HIDDEN_FEATURES_ATTR = "data-rzc-hide-features";
  const PREV_DISPLAY_ATTR = "data-rzc-prev-display";
  const PREV_DISPLAY_PRIORITY_ATTR = "data-rzc-prev-display-priority";
  const PREV_VISIBILITY_ATTR = "data-rzc-prev-visibility";
  const PREV_VISIBILITY_PRIORITY_ATTR = "data-rzc-prev-visibility-priority";
  const STYLE_DIRTY_ATTR = "data-rzc-style-dirty";
  const RICH_COLLAPSIBLE_ATTR = "data-rzc-rich-collapsible";
  const RICH_TOGGLE_ATTR = "data-rzc-rich-toggle";

  const FEATURE = {
    PROMO_MAIN: "promo-main",
    PROMO_LABELS: "promo-labels",
    PRODUCT_PICTOGRAMS: "product-pictograms",
    RED_BONUS: "red-bonus",
    BONUS_POINTS: "bonus-points",
    ADVERTISING: "advertising",
    QUICK_FILTERS: "quick-filters",
    AI_BUTTON: "ai-button",
    AI_CONSULT: "ai-consultation",
    POPULAR_SEARCH_CHIPS: "popular-search-chips",
    SMART_DELIVERY_BADGE: "smart-delivery-badge",
    EMAIL_SUBSCRIPTION_BANNER: "email-subscription-banner",
    SUPER_OFFER: "super-offer",
    PRODUCT_SERVICES: "product-services",
    STICKY_PRODUCT_CARRIAGE: "sticky-product-carriage",
    PROMOTION_PRODUCT: "promotion-product",
    CUSTOM: "custom"
  };

  const CLEANUP_TIMEOUT_MS = 200;
  const MAX_PENDING_ROOTS = 200;
  const SETTINGS_SYNC_DEBOUNCE_MS = 120;
  const PAGE_CONTEXT_REQUEST_TYPE = "RZC_GET_PAGE_CONTEXT";
  const POPUP_FEATURES_REQUEST_TYPE = "RZC_GET_POPUP_FEATURES";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DIAGNOSTICS_STORAGE_KEY = `${STORAGE_KEY}_diagnostics`;
  const DIAGNOSTICS_DEBOUNCE_MS = 450;
  const ROOT_CLASS_NORMALIZE = CONFIG.rootClassNormalizePrice || "rzc-normalize-price";
  const HIDDEN_CLASS = CONFIG.hiddenClass || "rzc-hidden";
  const DEFAULTS = CONFIG.defaults || {};
  const SELECTORS = CONFIG.selectors || {};
  const FEATURE_REGISTRY = globalThis.RZCFeatureRegistry || {};
  const OBSERVER_HINT_SELECTOR = [
    "rz-product-tile",
    "rz-red-price",
    "rz-promo-label",
    "rz-product-pictograms",
    "rz-product-banner",
    "rz-tile-bonus",
    "rz-product-red-bonus",
    "rz-section-slider",
    "rz-product-anchor-links",
    "rz-tile-info",
    "rz-chat-bot-button-assist",
    "rz-chat-bot-button-placeholder",
    "rz-smart-description-button",
    "rz-delivery-premium",
    "rz-delivery-price",
    "rz-marketing-subscription-banner",
    "rz-super-offer",
    "rz-product-services",
    "rz-product-carriage",
    "rz-promotion-product",
    "rz-store-rich-content",
    "rz-tag-list",
    '[data-testid="advertising-slider"]',
    '[data-testid="promo-price"]',
    ".red-label",
    ".tile-promo-label",
    ".promo-label",
    ".vertical-theme",
    ".red-icon",
    ".bonus__red",
    ".loyalty__red-card",
    ".advertising-slider-theme",
    ".product-anchor-links__list-wrapper",
    ".tile-smart-icon",
    ".premium--title",
    ".super-offer",
    ".additional-services-container",
    ".carriage__main",
    ".product-promotion",
    ".rich-content",
    ".tags-list"
  ].join(", ");
  const HINT_TAGS = new Set([
    "RZ-PRODUCT-TILE",
    "RZ-RED-PRICE",
    "RZ-PROMO-LABEL",
    "RZ-PRODUCT-PICTOGRAMS",
    "RZ-PRODUCT-BANNER",
    "RZ-TILE-BONUS",
    "RZ-PRODUCT-RED-BONUS",
    "RZ-SECTION-SLIDER",
    "RZ-PRODUCT-ANCHOR-LINKS",
    "RZ-TILE-INFO",
    "RZ-CHAT-BOT-BUTTON-ASSIST",
    "RZ-CHAT-BOT-BUTTON-PLACEHOLDER",
    "RZ-SMART-DESCRIPTION-BUTTON",
    "RZ-DELIVERY-PREMIUM",
    "RZ-DELIVERY-PRICE",
    "RZ-MARKETING-SUBSCRIPTION-BANNER",
    "RZ-SUPER-OFFER",
    "RZ-PRODUCT-SERVICES",
    "RZ-PRODUCT-CARRIAGE",
    "RZ-PROMOTION-PRODUCT",
    "RZ-STORE-RICH-CONTENT",
    "RZ-TAG-LIST"
  ]);
  const HINT_CLASSES = [
    "red-label",
    "tile-promo-label",
    "promo-label",
    "red-icon",
    "bonus__red",
    "loyalty__red-card",
    "advertising-slider-theme",
    "product-anchor-links__list-wrapper",
    "tile-smart-icon",
    "premium--title",
    "super-offer",
    "additional-services-container",
    "carriage__main",
    "product-promotion",
    "rich-content",
    "tags-list",
    "max-three-rows"
  ];
  const MANAGED_FEATURES = [
    FEATURE.PROMO_MAIN,
    FEATURE.PROMO_LABELS,
    FEATURE.PRODUCT_PICTOGRAMS,
    FEATURE.RED_BONUS,
    FEATURE.BONUS_POINTS,
    FEATURE.ADVERTISING,
    FEATURE.QUICK_FILTERS,
    FEATURE.AI_BUTTON,
    FEATURE.AI_CONSULT,
    FEATURE.POPULAR_SEARCH_CHIPS,
    FEATURE.SMART_DELIVERY_BADGE,
    FEATURE.EMAIL_SUBSCRIPTION_BANNER,
    FEATURE.SUPER_OFFER,
    FEATURE.PRODUCT_SERVICES,
    FEATURE.STICKY_PRODUCT_CARRIAGE,
    FEATURE.PROMOTION_PRODUCT,
    FEATURE.CUSTOM
  ];

  let currentSettings = normalizeSettings(DEFAULTS);
  let observer = null;
  let cleanupRaf = 0;
  let cleanupTimer = 0;
  let settingsSyncTimer = 0;
  let diagnosticsTimer = 0;
  const pendingRoots = new Set();
  let onStorageChanged = null;
  let onRuntimeMessage = null;
  const internalStyleWriteCounts = new WeakMap();

  function parseFeatureSet(el) {
    const raw = el.getAttribute(HIDDEN_FEATURES_ATTR) || "";
    if (!raw) return new Set();
    return new Set(raw.split(",").map((part) => part.trim()).filter(Boolean));
  }

  function writeFeatureSet(el, set) {
    if (!set.size) {
      el.removeAttribute(HIDDEN_FEATURES_ATTR);
      return;
    }
    el.setAttribute(HIDDEN_FEATURES_ATTR, Array.from(set).sort().join(","));
  }

  function safeQueryAll(scope, selector) {
    if (!scope || typeof scope.querySelectorAll !== "function") return [];
    try {
      return scope.querySelectorAll(selector);
    } catch (err) {
      return [];
    }
  }

  function safeClosest(node, selector) {
    if (!node || typeof node.closest !== "function" || !selector) return null;
    try {
      return node.closest(selector);
    } catch (err) {
      return null;
    }
  }

  function getTextList(raw, limit = 50) {
    if (typeof raw !== "string") return [];
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, limit);
  }

  function textContainsAny(text, list) {
    if (!text || !list || !list.length) return false;
    const normalized = String(text).toLowerCase();
    return list.some((needle) => normalized.includes(needle));
  }

  function markInternalStyleWrite(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    const prevCount = internalStyleWriteCounts.get(el) || 0;
    internalStyleWriteCounts.set(el, prevCount + 1);
  }

  function consumeInternalStyleWrite(el) {
    const prevCount = internalStyleWriteCounts.get(el) || 0;
    if (!prevCount) return false;
    if (prevCount === 1) {
      internalStyleWriteCounts.delete(el);
      return true;
    }
    internalStyleWriteCounts.set(el, prevCount - 1);
    return true;
  }

  function clearStyleSnapshot(el) {
    el.removeAttribute(PREV_DISPLAY_ATTR);
    el.removeAttribute(PREV_DISPLAY_PRIORITY_ATTR);
    el.removeAttribute(PREV_VISIBILITY_ATTR);
    el.removeAttribute(PREV_VISIBILITY_PRIORITY_ATTR);
  }

  function rememberInlineStyle(el, prop, valueAttr, priorityAttr) {
    if (el.hasAttribute(valueAttr)) return;
    const value = el.style.getPropertyValue(prop);
    const priority = el.style.getPropertyPriority(prop);
    el.setAttribute(valueAttr, value === "" ? "__empty__" : value);
    el.setAttribute(priorityAttr, priority === "" ? "__empty__" : priority);
  }

  function restoreInlineStyle(el, prop, valueAttr, priorityAttr) {
    if (!el.hasAttribute(valueAttr)) {
      markInternalStyleWrite(el);
      el.style.removeProperty(prop);
      return;
    }

    const value = el.getAttribute(valueAttr);
    const priority = el.getAttribute(priorityAttr);
    if (value === "__empty__") {
      markInternalStyleWrite(el);
      el.style.removeProperty(prop);
    } else {
      markInternalStyleWrite(el);
      el.style.setProperty(prop, value, priority === "__empty__" ? "" : priority);
    }

    el.removeAttribute(valueAttr);
    el.removeAttribute(priorityAttr);
  }

  function applyHideStyles(el) {
    rememberInlineStyle(el, "display", PREV_DISPLAY_ATTR, PREV_DISPLAY_PRIORITY_ATTR);
    rememberInlineStyle(el, "visibility", PREV_VISIBILITY_ATTR, PREV_VISIBILITY_PRIORITY_ATTR);
    markInternalStyleWrite(el);
    el.style.setProperty("display", "none", "important");
    markInternalStyleWrite(el);
    el.style.setProperty("visibility", "hidden", "important");
  }

  function revealElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    el.removeAttribute(HIDDEN_ATTR);
    el.classList.remove(HIDDEN_CLASS);
    const isDirty = el.getAttribute(STYLE_DIRTY_ATTR) === "1";
    el.removeAttribute(STYLE_DIRTY_ATTR);

    // If site changed inline styles while hidden, avoid restoring stale snapshot values.
    if (isDirty) {
      clearStyleSnapshot(el);
      markInternalStyleWrite(el);
      el.style.removeProperty("display");
      markInternalStyleWrite(el);
      el.style.removeProperty("visibility");
      return;
    }

    restoreInlineStyle(el, "display", PREV_DISPLAY_ATTR, PREV_DISPLAY_PRIORITY_ATTR);
    restoreInlineStyle(el, "visibility", PREV_VISIBILITY_ATTR, PREV_VISIBILITY_PRIORITY_ATTR);
  }

  function hideElement(el, featureId) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

    const featureSet = parseFeatureSet(el);
    if (featureId) featureSet.add(featureId);
    if (!featureSet.size) return;

    writeFeatureSet(el, featureSet);
    el.setAttribute(HIDDEN_ATTR, "1");
    el.classList.add(HIDDEN_CLASS);
    applyHideStyles(el);
  }

  function removeHideFeature(el, featureId) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

    const featureSet = parseFeatureSet(el);
    if (!featureSet.has(featureId)) return;
    featureSet.delete(featureId);

    if (!featureSet.size) {
      writeFeatureSet(el, featureSet);
      revealElement(el);
      return;
    }

    writeFeatureSet(el, featureSet);
    el.setAttribute(HIDDEN_ATTR, "1");
    el.classList.add(HIDDEN_CLASS);
    applyHideStyles(el);
  }

  function removeFeatureFromAll(root, featureId) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(`[${HIDDEN_FEATURES_ATTR}]`).forEach((el) => {
      removeHideFeature(el, featureId);
    });
  }

  function hideRuleSelectors(root, rules, featureId) {
    const scope = root && root.querySelectorAll ? root : document;
    let matched = false;
    rules.forEach((rule) => {
      if (!rule || !rule.query) return;
      safeQueryAll(scope, rule.query).forEach((node) => {
        matched = true;
        const removable = rule.closest ? safeClosest(node, rule.closest) || node : node;
        hideElement(removable, featureId);
      });
    });
    return matched;
  }

  function hideSelectorList(root, selectors, featureId, extraClosestSelectors = []) {
    const scope = root && root.querySelectorAll ? root : document;
    let matched = false;
    selectors.forEach((selector) => {
      safeQueryAll(scope, selector).forEach((el) => {
        matched = true;
        hideElement(el, featureId);
        extraClosestSelectors.forEach((closestSel) => hideElement(safeClosest(el, closestSel), featureId));
      });
    });
    return matched;
  }

  function countUniqueMatchesByRules(scope, rules) {
    const nodes = new Set();
    rules.forEach((rule) => {
      if (!rule || !rule.query) return;
      safeQueryAll(scope, rule.query).forEach((el) => nodes.add(el));
    });
    return nodes.size;
  }

  function countUniqueMatchesBySelectors(scope, selectors) {
    const nodes = new Set();
    selectors.forEach((selector) => {
      safeQueryAll(scope, selector).forEach((el) => nodes.add(el));
    });
    return nodes.size;
  }

  function countHiddenByFeature(scope, featureId) {
    let count = 0;
    safeQueryAll(scope, `[${HIDDEN_FEATURES_ATTR}]`).forEach((el) => {
      const featureSet = parseFeatureSet(el);
      if (featureSet.has(featureId)) count += 1;
    });
    return count;
  }

  function hasTextFallbackSignal(pageText, phrases) {
    if (!phrases || !phrases.length) return null;
    return phrases.some((needle) => pageText.includes(needle));
  }

  function getFeatureModuleContext() {
    return {
      FEATURE,
      SELECTORS,
      HIDDEN_FEATURES_ATTR,
      RICH_COLLAPSIBLE_ATTR,
      RICH_TOGGLE_ATTR,
      safeQueryAll,
      safeClosest,
      textContainsAny,
      hasTextFallbackSignal,
      parseFeatureSet,
      hideElement,
      hideRuleSelectors,
      hideSelectorList,
      removeFeatureFromAll,
      countUniqueMatchesByRules,
      countUniqueMatchesBySelectors
    };
  }

  function isExtensionEnabled(settings) {
    if (!settings || settings.enabled === false) return false;
    const pauseUntil = Number(settings.pauseUntil || 0);
    if (pauseUntil > Date.now()) return false;
    return true;
  }

  function detectPageTypeFromUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "unknown";
    if (!/^https?:\/\/(?:[\w-]+\.)*rozetka\.com\.ua\//i.test(raw)) return "other";
    if (/\/p\d+(?:\/|$)/i.test(raw)) return "product";
    if (/\/c\d+(?:\/|$)/i.test(raw)) return "catalog";
    return "other";
  }

  function getDiagnosticsFeatureEntries(settings, scope) {
    const customSelectors = settings.customHideSelectorList || [];
    const pageText = (scope.textContent || "").toLowerCase();
    const extensionEnabled = isExtensionEnabled(settings);
    const context = getFeatureModuleContext();
    const registryEntries =
      typeof FEATURE_REGISTRY.diagnosticsEntries === "function"
        ? FEATURE_REGISTRY.diagnosticsEntries(context, settings, scope, extensionEnabled, pageText)
        : [];

    return [
      ...registryEntries,
      {
        id: FEATURE.CUSTOM,
        enabled: extensionEnabled && customSelectors.length > 0,
        selectorMatches: countUniqueMatchesBySelectors(scope, customSelectors),
        textMatch: null
      },
      {
        id: "normalize-price-layout",
        enabled: extensionEnabled && Boolean(settings.normalizePriceLayout),
        selectorMatches: countUniqueMatchesBySelectors(scope, [
          "rz-product-tile",
          "rz-product-tile rz-tile-price",
          "rz-product-tile rz-red-price"
        ]),
        textMatch: null,
        statusMode: "presence"
      }
    ].map((entry) => {
      const hiddenCount = countHiddenByFeature(scope, entry.id);
      const hasSelectorOrTextSignal =
        entry.selectorMatches > 0 ||
        (entry.textMatch !== null && entry.textMatch === true);
      let status = entry.id === FEATURE.CUSTOM ? "not_configured" : "disabled";

      if (entry.enabled) {
        if (entry.statusMode === "presence") {
          status = hasSelectorOrTextSignal ? "ok" : "not_on_page";
        } else {
          if (hasSelectorOrTextSignal && hiddenCount === 0) {
            // Something matching was found but nothing got hidden.
            status = "warning";
          } else if (!hasSelectorOrTextSignal && hiddenCount === 0) {
            // This page likely just doesn't contain this block type.
            status = "not_on_page";
          } else {
            status = "ok";
          }
        }
      }

      return {
        ...entry,
        hiddenCount,
        status
      };
    });
  }

  function writeDiagnosticsSnapshot(snapshot) {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.set({ [DIAGNOSTICS_STORAGE_KEY]: snapshot }, () => {});
  }

  function flushDiagnostics(settings) {
    diagnosticsTimer = 0;
    const scope = document;
    const features = getDiagnosticsFeatureEntries(settings, scope);
    const enabledCount = features.filter((item) => item.enabled).length;
    const okCount = features.filter((item) => item.enabled && item.status === "ok").length;
    const warningCount = features.filter((item) => item.enabled && item.status === "warning").length;
    const notOnPageCount = features.filter((item) => item.enabled && item.status === "not_on_page").length;

    writeDiagnosticsSnapshot({
      updatedAt: Date.now(),
      url: location.href,
      host: location.host,
      summary: {
        enabledCount,
        okCount,
        warningCount,
        notOnPageCount
      },
      features
    });
  }

  function scheduleDiagnostics(settings) {
    if (!chrome.storage || !chrome.storage.local) return;
    if (diagnosticsTimer) window.clearTimeout(diagnosticsTimer);
    diagnosticsTimer = window.setTimeout(() => flushDiagnostics(settings), DIAGNOSTICS_DEBOUNCE_MS);
  }

  function runCleanup(root, settings) {
    const context = getFeatureModuleContext();
    if (!isExtensionEnabled(settings)) {
      if (typeof FEATURE_REGISTRY.onDisabled === "function") {
        FEATURE_REGISTRY.onDisabled(context, root);
      }
      scheduleDiagnostics(settings);
      return;
    }

    if (typeof FEATURE_REGISTRY.runFeatureCleanup === "function") {
      FEATURE_REGISTRY.runFeatureCleanup(context, root, settings);
    }
    hideCustomSelectors(root, settings);
    scheduleDiagnostics(settings);
  }

  function containsHintTargets(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (isPotentialHintFast(node)) return true;
    if (typeof node.querySelector === "function" && safeQueryAll(node, OBSERVER_HINT_SELECTOR).length > 0) return true;
    return false;
  }

  function isRelevantAttributeTarget(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (isPotentialHintFast(node)) return true;
    if (typeof node.closest === "function" && node.closest(OBSERVER_HINT_SELECTOR)) return true;
    return false;
  }

  function hasHintClass(node) {
    if (!node || !node.classList) return false;
    for (const className of HINT_CLASSES) {
      if (node.classList.contains(className)) return true;
    }
    return false;
  }

  function isPotentialHintFast(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.hasAttribute(HIDDEN_FEATURES_ATTR) || node.hasAttribute(HIDDEN_ATTR)) return true;
    if (HINT_TAGS.has(node.tagName)) return true;
    if (hasHintClass(node)) return true;
    return false;
  }

  function isStableHiddenByUs(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return (
      node.getAttribute(HIDDEN_ATTR) === "1" &&
      node.classList.contains(HIDDEN_CLASS) &&
      node.style.getPropertyValue("display") === "none"
    );
  }

  function flushPendingCleanup() {
    if (cleanupRaf) {
      window.cancelAnimationFrame(cleanupRaf);
      cleanupRaf = 0;
    }
    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = 0;
    }

    if (!pendingRoots.size) return;
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();
    roots.forEach((node) => runCleanup(node, currentSettings));
  }

  function scheduleCleanup(root) {
    if (!root || !root.querySelectorAll) return;

    pendingRoots.add(root);
    if (pendingRoots.size > MAX_PENDING_ROOTS) {
      pendingRoots.clear();
      pendingRoots.add(document);
    }

    if (!cleanupRaf) {
      cleanupRaf = window.requestAnimationFrame(flushPendingCleanup);
    }
    if (!cleanupTimer) {
      cleanupTimer = window.setTimeout(flushPendingCleanup, CLEANUP_TIMEOUT_MS);
    }
  }

  function initObserver() {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (!containsHintTargets(node)) continue;
            scheduleCleanup(node);
          }
          continue;
        }

        if (mutation.type === "attributes") {
          const target = mutation.target;
          if (mutation.attributeName === "style") {
            if (consumeInternalStyleWrite(target)) {
              continue;
            }
            if (target.getAttribute(HIDDEN_FEATURES_ATTR)) {
              target.setAttribute(STYLE_DIRTY_ATTR, "1");
            }
          }

          if (!isRelevantAttributeTarget(target)) continue;
          if (isStableHiddenByUs(target)) continue;
          scheduleCleanup(target);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (cleanupRaf) {
      window.cancelAnimationFrame(cleanupRaf);
      cleanupRaf = 0;
    }
    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = 0;
    }
    if (settingsSyncTimer) {
      window.clearTimeout(settingsSyncTimer);
      settingsSyncTimer = 0;
    }
    if (diagnosticsTimer) {
      window.clearTimeout(diagnosticsTimer);
      flushDiagnostics(currentSettings);
    }
    pendingRoots.clear();

    if (onStorageChanged && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      onStorageChanged = null;
    }
    if (onRuntimeMessage && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
      onRuntimeMessage = null;
    }
  }

  function readSettings() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.sync) {
        resolve(normalizeSettings(DEFAULTS));
        return;
      }

      chrome.storage.sync.get({ ...DEFAULTS, [STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(normalizeSettings(DEFAULTS));
          return;
        }

        const namespaced =
          stored[STORAGE_KEY] && typeof stored[STORAGE_KEY] === "object"
            ? stored[STORAGE_KEY]
            : {};
        const legacy = {};
        Object.keys(DEFAULTS).forEach((key) => {
          if (key in stored) legacy[key] = stored[key];
        });

        resolve(normalizeSettings({ ...DEFAULTS, ...legacy, ...namespaced }));
      });
    });
  }

  function getCustomSelectors(raw) {
    if (typeof raw !== "string") return [];
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  function normalizeSettings(raw) {
    const merged = { ...DEFAULTS, ...(raw || {}) };
    merged.enabled = merged.enabled !== false;
    merged.pauseUntil = Number.isFinite(Number(merged.pauseUntil)) ? Number(merged.pauseUntil) : 0;
    merged.customHideSelectors = typeof merged.customHideSelectors === "string" ? merged.customHideSelectors : "";
    merged.aiButtonTexts = typeof merged.aiButtonTexts === "string" ? merged.aiButtonTexts : "";
    merged.aiConsultationTexts = typeof merged.aiConsultationTexts === "string" ? merged.aiConsultationTexts : "";
    merged.popularSearchTexts = typeof merged.popularSearchTexts === "string" ? merged.popularSearchTexts : "";
    merged.advertisingTexts = typeof merged.advertisingTexts === "string" ? merged.advertisingTexts : "";
    merged.quickFiltersTexts = typeof merged.quickFiltersTexts === "string" ? merged.quickFiltersTexts : "";
    merged.customHideSelectorList = getCustomSelectors(merged.customHideSelectors);
    merged.aiButtonTextList = getTextList(merged.aiButtonTexts);
    merged.aiConsultationTextList = getTextList(merged.aiConsultationTexts);
    merged.popularSearchTextList = getTextList(merged.popularSearchTexts);
    merged.advertisingTextList = getTextList(merged.advertisingTexts);
    merged.quickFiltersTextList = getTextList(merged.quickFiltersTexts);
    return merged;
  }

  function removeAllManagedFeatures(root) {
    MANAGED_FEATURES.forEach((featureId) => removeFeatureFromAll(root, featureId));
  }

  function hideCustomSelectors(root, settings) {
    const list = settings.customHideSelectorList || [];
    if (!list.length) return;
    const scope = root && root.querySelectorAll ? root : document;

    list.forEach((selector) => {
      safeQueryAll(scope, selector).forEach((node) => hideElement(node, FEATURE.CUSTOM));
    });
  }

  function applyLayoutMode(settings) {
    const root = document.documentElement;
    if (!isExtensionEnabled(settings)) {
      root.classList.remove(ROOT_CLASS_NORMALIZE);
      return;
    }
    if (settings.normalizePriceLayout) {
      root.classList.add(ROOT_CLASS_NORMALIZE);
      return;
    }
    root.classList.remove(ROOT_CLASS_NORMALIZE);
  }

  function reconcileSettings(prevSettings, nextSettings) {
    const context = getFeatureModuleContext();
    const prevEnabled = isExtensionEnabled(prevSettings);
    const nextEnabled = isExtensionEnabled(nextSettings);
    if (prevEnabled && !nextEnabled) {
      removeAllManagedFeatures(document);
      if (typeof FEATURE_REGISTRY.onDisabled === "function") {
        FEATURE_REGISTRY.onDisabled(context, document);
      }
      return;
    }
    if (!nextEnabled) return;
    if (typeof FEATURE_REGISTRY.reconcile === "function") {
      FEATURE_REGISTRY.reconcile(context, prevSettings, nextSettings);
    }
    if (prevSettings.customHideSelectors !== nextSettings.customHideSelectors) {
      removeFeatureFromAll(document, FEATURE.CUSTOM);
    }
  }

  function watchSettingsChanges() {
    if (!chrome.storage || !chrome.storage.onChanged) return;

    function scheduleSettingsRefresh() {
      if (settingsSyncTimer) window.clearTimeout(settingsSyncTimer);
      settingsSyncTimer = window.setTimeout(() => {
        settingsSyncTimer = 0;
        readSettings().then((settings) => {
          const prevSettings = currentSettings;
          currentSettings = settings;
          reconcileSettings(prevSettings, currentSettings);
          applyLayoutMode(currentSettings);
          scheduleCleanup(document);
        });
      }, SETTINGS_SYNC_DEBOUNCE_MS);
    }

    onStorageChanged = (changes, areaName) => {
      if (areaName !== "sync") return;

      const hasNamespaced = Boolean(changes[STORAGE_KEY]);
      const hasLegacy = Object.keys(DEFAULTS).some((key) => key in changes);
      if (!hasNamespaced && !hasLegacy) return;
      scheduleSettingsRefresh();
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
  }

  function watchRuntimeMessages() {
    if (!chrome.runtime || !chrome.runtime.onMessage || typeof chrome.runtime.onMessage.addListener !== "function") {
      return;
    }
    onRuntimeMessage = (message, _sender, sendResponse) => {
      if (!message || typeof message.type !== "string") return;
      if (message.type === PAGE_CONTEXT_REQUEST_TYPE) {
        sendResponse({
          url: location.href,
          pageType: detectPageTypeFromUrl(location.href)
        });
        return;
      }
      if (message.type === POPUP_FEATURES_REQUEST_TYPE) {
        sendResponse({
          updatedAt: Date.now(),
          url: location.href,
          pageType: detectPageTypeFromUrl(location.href),
          features: getDiagnosticsFeatureEntries(currentSettings, document)
        });
      }
    };
    chrome.runtime.onMessage.addListener(onRuntimeMessage);
  }

    readSettings().then((settings) => {
      currentSettings = settings;
      applyLayoutMode(currentSettings);
      runCleanup(document, currentSettings);
      initObserver();
      watchSettingsChanges();
      watchRuntimeMessages();
      window.addEventListener("pagehide", stopObserver, { once: true });
    });
  }

  globalThis.RZCContentCore = globalThis.RZCContentCore || { init };
})();
