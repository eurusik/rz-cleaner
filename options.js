(function () {
  "use strict";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DEFAULTS = CONFIG.defaults || {};
  const SELECTORS = CONFIG.selectors || { promo: [], ai: [], aiTextNodes: "" };
  const FALLBACK_TEXT_KEYS = [
    "aiButtonTexts",
    "aiConsultationTexts",
    "popularSearchTexts",
    "advertisingTexts",
    "quickFiltersTexts"
  ].filter((key) => key in DEFAULTS);
  const CUSTOM_SELECTOR_KEY = "customHideSelectors";

  const statusEl = document.getElementById("status");
  const activeSelectorsEl = document.getElementById("activeSelectors");
  const resetFallbackBtn = document.getElementById("resetFallbackTexts");
  const resetCustomSelectorsBtn = document.getElementById("resetCustomSelectors");
  const checkboxKeys = Object.keys(DEFAULTS).filter((k) => typeof DEFAULTS[k] === "boolean");
  const textKeys = Object.keys(DEFAULTS).filter((k) => typeof DEFAULTS[k] === "string");
  let statusTimer = 0;
  let saveTimer = 0;
  let currentSettings = { ...DEFAULTS };

  function getCustomSelectors(raw) {
    if (typeof raw !== "string") return [];
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  function getTextPhrases(raw) {
    if (typeof raw !== "string") return [];
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  function getBuiltInSelectors() {
    const promoMain = (SELECTORS.promoMain || SELECTORS.promo || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    const redBonus = (SELECTORS.redBonus || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    const advertising = (SELECTORS.advertising || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    const quickFilters = (SELECTORS.quickFilters || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    const aiButton = (SELECTORS.aiButton || SELECTORS.ai || []).filter(Boolean);
    const aiConsultation = (SELECTORS.aiConsultation || []).filter(Boolean);
    const popularSearchChips = (SELECTORS.popularSearchChips || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    return { promoMain, redBonus, advertising, quickFilters, aiButton, aiConsultation, popularSearchChips };
  }

  function renderActiveSelectors(settings) {
    if (!activeSelectorsEl) return;
    const builtIn = getBuiltInSelectors();
    const custom = getCustomSelectors(settings.customHideSelectors);
    const aiButtonTexts = getTextPhrases(settings.aiButtonTexts);
    const aiConsultationTexts = getTextPhrases(settings.aiConsultationTexts);
    const popularSearchTexts = getTextPhrases(settings.popularSearchTexts);
    const advertisingTexts = getTextPhrases(settings.advertisingTexts);
    const quickFiltersTexts = getTextPhrases(settings.quickFiltersTexts);

    const lines = [
      "# Promo selectors (built-in)",
      ...builtIn.promoMain,
      "",
      "# Red bonus selectors (built-in)",
      ...builtIn.redBonus,
      "",
      "# Advertising selectors (built-in)",
      ...builtIn.advertising,
      "",
      "# Quick filters selectors (built-in)",
      ...builtIn.quickFilters,
      "",
      "# Rozetka AI button selectors (built-in)",
      ...builtIn.aiButton,
      "",
      "# Rozetka AI consultation selectors (built-in)",
      ...builtIn.aiConsultation,
      "",
      "# Popular search chips selectors (built-in)",
      ...builtIn.popularSearchChips,
      "",
      "# Запасний пошук: кнопка AI",
      ...aiButtonTexts,
      "",
      "# Запасний пошук: консультація AI",
      ...aiConsultationTexts,
      "",
      "# Запасний пошук: популярні запити",
      ...popularSearchTexts,
      "",
      "# Запасний пошук: реклама",
      ...advertisingTexts,
      "",
      "# Запасний пошук: швидкі фільтри",
      ...quickFiltersTexts
    ];

    if (custom.length) {
      lines.push("", "# Custom selectors (your settings)", ...custom);
    }

    activeSelectorsEl.value = lines.join("\n");
  }

  function applySettingsToUI(settings) {
    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.checked = Boolean(settings[key]);
    });

    textKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.value = typeof settings[key] === "string" ? settings[key] : "";
    });

    renderActiveSelectors(settings);
  }

  function showStatus(text, variant = "success") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status-error", variant === "error");
    if (statusTimer) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (statusEl.textContent === text) {
        statusEl.textContent = "";
        statusEl.classList.remove("status-error");
      }
      statusTimer = 0;
    }, 1200);
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.sync) {
        resolve({ ...DEFAULTS });
        return;
      }

      chrome.storage.sync.get({ ...DEFAULTS, [STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({ ...DEFAULTS });
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

        resolve({ ...DEFAULTS, ...legacy, ...namespaced });
      });
    });
  }

  function saveSettings(nextSettings) {
    if (!chrome.storage || !chrome.storage.sync) return;
    chrome.storage.sync.set({ [STORAGE_KEY]: nextSettings }, () => {
      const runtimeError = chrome.runtime && chrome.runtime.lastError;
      if (runtimeError) {
        console.error("[RZC] Failed to save settings:", runtimeError);
        showStatus("Помилка збереження", "error");
        return;
      }
      showStatus("Збережено", "success");
    });
  }

  function scheduleSave(delayMs) {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = 0;
      saveSettings(currentSettings);
    }, delayMs);
  }

  function flushPendingSave() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = 0;
      saveSettings(currentSettings);
    }
  }

  loadSettings().then((settings) => {
    currentSettings = settings;
    applySettingsToUI(currentSettings);

    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.addEventListener("change", () => {
        currentSettings[key] = el.checked;
        scheduleSave(0);
      });
    });

    textKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.addEventListener("input", () => {
        currentSettings[key] = el.value;
        renderActiveSelectors(currentSettings);
        scheduleSave(250);
      });
    });

    if (resetFallbackBtn) {
      resetFallbackBtn.addEventListener("click", () => {
        FALLBACK_TEXT_KEYS.forEach((key) => {
          currentSettings[key] = typeof DEFAULTS[key] === "string" ? DEFAULTS[key] : "";
        });
        applySettingsToUI(currentSettings);
        scheduleSave(0);
      });
    }

    if (resetCustomSelectorsBtn) {
      resetCustomSelectorsBtn.addEventListener("click", () => {
        currentSettings[CUSTOM_SELECTOR_KEY] =
          typeof DEFAULTS[CUSTOM_SELECTOR_KEY] === "string" ? DEFAULTS[CUSTOM_SELECTOR_KEY] : "";
        applySettingsToUI(currentSettings);
        scheduleSave(0);
      });
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingSave();
    }
  });
  window.addEventListener("pagehide", flushPendingSave, { once: true });
})();
