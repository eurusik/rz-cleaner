(function () {
  "use strict";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DIAGNOSTICS_STORAGE_KEY = `${STORAGE_KEY}_diagnostics`;
  const DEFAULTS = CONFIG.defaults || {};
  const ENABLED_KEY = "enabled";
  const PAUSE_UNTIL_KEY = "pauseUntil";
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const PAGE_CONTEXT_REQUEST_TYPE = "RZC_GET_PAGE_CONTEXT";
  const POPUP_FEATURES_REQUEST_TYPE = "RZC_GET_POPUP_FEATURES";

  const statusEl = document.getElementById("status");
  const pauseInfoEl = document.getElementById("pauseInfo");
  const extensionEnabledEl = document.getElementById("extensionEnabled");
  const disableOneHourBtn = document.getElementById("disableOneHour");
  const togglesEl = document.querySelector(".toggles");

  const FEATURE_BY_TOGGLE_KEY = {
    hideAdvertisingSections: "advertising",
    hidePromoBlocks: "promo-main",
    hidePromoLabels: "promo-labels",
    hideProductPictograms: "product-pictograms",
    hideRedBonusBlocks: "red-bonus",
    hideBonusPoints: "bonus-points",
    hideQuickFilters: "quick-filters",
    hideRozetkaAI: "ai-button",
    hideAiConsultationBlock: "ai-consultation",
    hidePopularSearchChips: "popular-search-chips",
    hideSmartDeliveryBadge: "smart-delivery-badge",
    hideEmailSubscriptionBanner: "email-subscription-banner",
    hideSuperOffer: "super-offer",
    hideProductServices: "product-services",
    hideStickyProductCarriage: "sticky-product-carriage",
    hidePromotionProduct: "promotion-product",
    enableTileGallery: "tile-gallery",
    normalizePriceLayout: "normalize-price-layout"
  };

  const CATALOG_ONLY_SCOPES_BY_TOGGLE_KEY = {
    enableTileGallery: ["catalog"],
    normalizePriceLayout: ["catalog"]
  };

  const toggleKeys = collectToggleKeys();

  function collectToggleKeys() {
    const fromDom = [];
    if (document && typeof document.querySelectorAll === "function") {
      const inputs = document.querySelectorAll(".toggles input[id]");
      inputs.forEach((input) => {
        if (!input || !input.id) return;
        fromDom.push(input.id);
      });
    }

    if (fromDom.length > 0) {
      return Array.from(new Set(fromDom));
    }

    const fallback = [];
    Object.keys(DEFAULTS).forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;
      if (typeof DEFAULTS[key] !== "boolean") return;
      fallback.push(key);
    });
    return fallback;
  }

  function rowIdForLegacyKey(key) {
    if (!key) return "";
    return `row${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  }

  function getRowByKey(key) {
    return document.getElementById(`row-${key}`) || document.getElementById(rowIdForLegacyKey(key));
  }

  function detectPageTypeFromUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "unknown";
    if (!/^https?:\/\/(?:[\w-]+\.)*rozetka\.com\.ua\//i.test(raw)) return "other";
    if (/\/p\d+(?:\/|$)/i.test(raw)) return "product";
    if (/\/c\d+(?:\/|$)/i.test(raw)) return "catalog";
    return "other";
  }

  function getTabUrl(tab) {
    if (!tab || typeof tab !== "object") return "";
    const rawUrl = tab.url || tab.pendingUrl || "";
    return String(rawUrl || "").trim();
  }

  function tabContextFromTab(tab) {
    const url = getTabUrl(tab);
    return {
      tabId: Number.isFinite(Number(tab && tab.id)) ? Number(tab.id) : null,
      url,
      pageType: detectPageTypeFromUrl(url),
      liveSnapshot: null
    };
  }

  function pickActiveTab(tabs) {
    if (!Array.isArray(tabs) || !tabs.length) return null;
    const rozetkaTab = tabs.find((tab) => detectPageTypeFromUrl(getTabUrl(tab)) !== "other");
    return rozetkaTab || tabs[0];
  }

  function queryTabs(queryInfo) {
    return new Promise((resolve) => {
      try {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve([]);
            return;
          }
          resolve(Array.isArray(tabs) ? tabs : []);
        });
      } catch (_error) {
        resolve([]);
      }
    });
  }

  function requestMessageToTab(tabId, payload) {
    return new Promise((resolve) => {
      if (!chrome.tabs || typeof chrome.tabs.sendMessage !== "function" || !Number.isFinite(Number(tabId))) {
        resolve(null);
        return;
      }
      try {
        chrome.tabs.sendMessage(tabId, payload, (response) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve(null);
            return;
          }
          resolve(response && typeof response === "object" ? response : null);
        });
      } catch (_error) {
        resolve(null);
      }
    });
  }

  function normalizeSnapshot(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (!Array.isArray(raw.features)) return null;
    return {
      updatedAt: Number(raw.updatedAt || 0),
      url: String(raw.url || "").trim(),
      features: raw.features.filter((entry) => entry && typeof entry.id === "string")
    };
  }

  function requestPopupSnapshotFromContent(tabId) {
    return requestMessageToTab(tabId, { type: POPUP_FEATURES_REQUEST_TYPE }).then((response) => {
      const snapshot = normalizeSnapshot(response);
      if (!snapshot) return null;
      return {
        ...snapshot,
        source: "content",
        pageType:
          typeof response.pageType === "string"
            ? response.pageType
            : detectPageTypeFromUrl(snapshot.url)
      };
    });
  }

  function requestPageContextFromContent(tabId) {
    return requestMessageToTab(tabId, { type: PAGE_CONTEXT_REQUEST_TYPE }).then((response) => {
      if (!response) return null;
      const url = String(response.url || "").trim();
      const pageType = typeof response.pageType === "string" ? response.pageType : detectPageTypeFromUrl(url);
      return {
        url,
        pageType: pageType || "unknown"
      };
    });
  }

  function getActiveTabContext() {
    if (!chrome.tabs || typeof chrome.tabs.query !== "function") {
      return Promise.resolve({ tabId: null, url: "", pageType: "unknown", liveSnapshot: null });
    }

    return queryTabs({ active: true, currentWindow: true })
      .then((tabs) => {
        const tab = pickActiveTab(tabs);
        if (tab) return tab;
        return queryTabs({ active: true, lastFocusedWindow: true }).then((fallbackTabs) =>
          pickActiveTab(fallbackTabs)
        );
      })
      .then((tab) => {
        if (tab) return tab;
        return queryTabs({ active: true }).then((allActiveTabs) => pickActiveTab(allActiveTabs));
      })
      .then((tab) => {
        if (!tab) {
          return {
            tabId: null,
            url: "",
            pageType: "unknown",
            liveSnapshot: null
          };
        }

        const baseContext = tabContextFromTab(tab);
        if (!Number.isFinite(Number(baseContext.tabId))) return baseContext;

        return requestPopupSnapshotFromContent(baseContext.tabId).then((liveSnapshot) => {
          if (liveSnapshot) {
            const mergedUrl = liveSnapshot.url || baseContext.url;
            return {
              tabId: baseContext.tabId,
              url: mergedUrl,
              pageType: liveSnapshot.pageType || detectPageTypeFromUrl(mergedUrl),
              liveSnapshot
            };
          }

          return requestPageContextFromContent(baseContext.tabId).then((contentContext) => {
            if (!contentContext) return baseContext;
            const mergedUrl = contentContext.url || baseContext.url;
            return {
              tabId: baseContext.tabId,
              url: mergedUrl,
              pageType: contentContext.pageType || detectPageTypeFromUrl(mergedUrl),
              liveSnapshot: null
            };
          });
        });
      });
  }

  function loadDiagnosticsSnapshot() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(null);
        return;
      }
      chrome.storage.local.get({ [DIAGNOSTICS_STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        const snapshot = normalizeSnapshot(stored ? stored[DIAGNOSTICS_STORAGE_KEY] : null);
        resolve(snapshot);
      });
    });
  }

  function isFreshDiagnostics(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return false;
    const updatedAt = Number(snapshot.updatedAt || 0);
    if (!updatedAt) return false;
    return Date.now() - updatedAt < 5 * 60 * 1000;
  }

  function normalizeComparableUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    try {
      const parsed = new URL(value);
      parsed.hash = "";
      return parsed.toString();
    } catch (_error) {
      return value;
    }
  }

  function isSnapshotForActiveContext(snapshot, activeContext) {
    if (!snapshot) return false;
    const contextUrl = normalizeComparableUrl(activeContext && activeContext.url);
    const snapshotUrl = normalizeComparableUrl(snapshot.url);
    if (!contextUrl || !snapshotUrl) return false;
    return contextUrl === snapshotUrl;
  }

  function pickFeatureSnapshot(activeContext, diagnosticsSnapshot) {
    const liveSnapshot = normalizeSnapshot(activeContext && activeContext.liveSnapshot);
    if (liveSnapshot && Array.isArray(liveSnapshot.features)) {
      return liveSnapshot;
    }

    if (!isFreshDiagnostics(diagnosticsSnapshot)) return null;
    if (!isSnapshotForActiveContext(diagnosticsSnapshot, activeContext)) return null;
    return diagnosticsSnapshot;
  }

  function featureEntryHasSignal(entry) {
    if (!entry || typeof entry !== "object") return null;
    const selectorMatches = Number(entry.selectorMatches || 0);
    const hiddenCount = Number(entry.hiddenCount || 0);
    const textMatch = entry.textMatch === true;
    return selectorMatches > 0 || hiddenCount > 0 || textMatch;
  }

  function buildFeatureSignals(snapshot) {
    const signals = new Map();
    if (!snapshot || !Array.isArray(snapshot.features)) return signals;

    snapshot.features.forEach((entry) => {
      if (!entry || typeof entry.id !== "string") return;
      const signal = featureEntryHasSignal(entry);
      if (signal === null) return;
      signals.set(entry.id, signal);
    });

    return signals;
  }

  function buildVisibilityMap(activeContext, snapshot) {
    const map = {};
    toggleKeys.forEach((key) => {
      map[key] = false;
    });
    if (!snapshot) return map;

    const featureSignals = buildFeatureSignals(snapshot);
    toggleKeys.forEach((key) => {
      const featureId = FEATURE_BY_TOGGLE_KEY[key];
      if (!featureId) return;
      if (!featureSignals.has(featureId)) return;
      map[key] = featureSignals.get(featureId) === true;
    });

    const pageType = activeContext && typeof activeContext.pageType === "string" ? activeContext.pageType : "unknown";
    if (pageType === "catalog" || pageType === "product") {
      toggleKeys.forEach((key) => {
        if (!CATALOG_ONLY_SCOPES_BY_TOGGLE_KEY[key]) return;
        const scopes = CATALOG_ONLY_SCOPES_BY_TOGGLE_KEY[key];
        if (!scopes.includes(pageType)) map[key] = false;
      });
    }

    return map;
  }

  function applyTogglesVisibility(visibilityMap) {
    toggleKeys.forEach((key) => {
      const row = getRowByKey(key);
      if (!row) return;
      row.hidden = visibilityMap[key] === false;
    });
  }

  function showStatus(text, variant = "ok") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove("status-ok", "status-error");
    statusEl.classList.add(variant === "error" ? "status-error" : "status-ok");
    window.setTimeout(() => {
      if (statusEl.textContent === text) {
        statusEl.textContent = "";
        statusEl.classList.remove("status-ok", "status-error");
      }
    }, 1200);
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.sync) {
        resolve({ ...DEFAULTS, [ENABLED_KEY]: true, [PAUSE_UNTIL_KEY]: 0 });
        return;
      }

      chrome.storage.sync.get({ ...DEFAULTS, [STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({ ...DEFAULTS, [ENABLED_KEY]: true, [PAUSE_UNTIL_KEY]: 0 });
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

        const merged = { ...DEFAULTS, ...legacy, ...namespaced };
        if (!(ENABLED_KEY in merged)) merged[ENABLED_KEY] = true;
        if (!Number.isFinite(Number(merged[PAUSE_UNTIL_KEY]))) merged[PAUSE_UNTIL_KEY] = 0;
        resolve(merged);
      });
    });
  }

  function saveSettings(nextSettings) {
    if (!chrome.storage || !chrome.storage.sync) return;

    chrome.storage.sync.set({ [STORAGE_KEY]: nextSettings }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        showStatus("Помилка збереження", "error");
        return;
      }
      showStatus("Збережено", "ok");
    });
  }

  function bindOptionsButton() {
    const openOptionsBtn = document.getElementById("openOptions");
    if (!openOptionsBtn) return;

    openOptionsBtn.addEventListener("click", () => {
      if (chrome.runtime && typeof chrome.runtime.openOptionsPage === "function") {
        chrome.runtime.openOptionsPage();
      }
      window.close();
    });
  }

  function isPaused(settings) {
    return Number(settings[PAUSE_UNTIL_KEY] || 0) > Date.now();
  }

  function isEffectivelyEnabled(settings) {
    return settings[ENABLED_KEY] !== false && !isPaused(settings);
  }

  function formatPauseTime(ts) {
    const time = new Date(ts);
    return time.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  }

  function renderPauseInfo(settings) {
    if (!pauseInfoEl) return;
    const pauseUntil = Number(settings[PAUSE_UNTIL_KEY] || 0);
    if (pauseUntil > Date.now()) {
      pauseInfoEl.textContent = `Пауза до ${formatPauseTime(pauseUntil)}`;
      return;
    }
    pauseInfoEl.textContent = "";
  }

  function updateTogglesState(enabled) {
    if (togglesEl) togglesEl.classList.toggle("is-disabled", !enabled);
    toggleKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;
      input.disabled = !enabled;
    });
    if (disableOneHourBtn) disableOneHourBtn.disabled = !enabled;
  }

  function initPopup(settings, activeContext, diagnosticsSnapshot) {
    const currentSettings = { ...settings };
    const snapshot = pickFeatureSnapshot(activeContext, diagnosticsSnapshot);
    const visibilityMap = buildVisibilityMap(activeContext, snapshot);
    applyTogglesVisibility(visibilityMap);

    const applyEffectiveState = () => {
      const effectiveEnabled = isEffectivelyEnabled(currentSettings);
      if (extensionEnabledEl) extensionEnabledEl.checked = effectiveEnabled;
      updateTogglesState(effectiveEnabled);
      renderPauseInfo(currentSettings);
    };

    applyEffectiveState();

    if (extensionEnabledEl) {
      extensionEnabledEl.addEventListener("change", () => {
        currentSettings[ENABLED_KEY] = extensionEnabledEl.checked;
        currentSettings[PAUSE_UNTIL_KEY] = 0;
        applyEffectiveState();
        saveSettings(currentSettings);
      });
    }

    if (disableOneHourBtn) {
      disableOneHourBtn.addEventListener("click", () => {
        currentSettings[ENABLED_KEY] = true;
        currentSettings[PAUSE_UNTIL_KEY] = Date.now() + ONE_HOUR_MS;
        applyEffectiveState();
        saveSettings(currentSettings);
        showStatus("Пауза на 1 год увімкнена", "ok");
      });
    }

    toggleKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;

      input.checked = Boolean(currentSettings[key]);
      input.addEventListener("change", () => {
        currentSettings[key] = input.checked;
        saveSettings(currentSettings);
      });
    });

    bindOptionsButton();
  }

  Promise.all([loadSettings(), getActiveTabContext(), loadDiagnosticsSnapshot()])
    .then(([settings, activeContext, diagnostics]) => {
      initPopup(settings, activeContext, diagnostics);
    })
    .catch(() => {
      initPopup(
        { ...DEFAULTS, [ENABLED_KEY]: true, [PAUSE_UNTIL_KEY]: 0 },
        { tabId: null, url: "", pageType: "unknown", liveSnapshot: null },
        null
      );
    });
})();
