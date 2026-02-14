(function () {
  "use strict";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DEFAULTS = CONFIG.defaults || {};
  const ENABLED_KEY = "enabled";
  const PAUSE_UNTIL_KEY = "pauseUntil";
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const statusEl = document.getElementById("status");
  const pauseInfoEl = document.getElementById("pauseInfo");
  const extensionEnabledEl = document.getElementById("extensionEnabled");
  const disableOneHourBtn = document.getElementById("disableOneHour");
  const togglesEl = document.querySelector(".toggles");

  const quickKeys = [
    "hideAdvertisingSections",
    "hidePromoBlocks",
    "hideSmartDeliveryBadge",
    "normalizePriceLayout"
  ].filter((key) => key in DEFAULTS);

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

  function updateQuickTogglesState(enabled) {
    if (togglesEl) togglesEl.classList.toggle("is-disabled", !enabled);
    quickKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;
      input.disabled = !enabled;
    });
    if (disableOneHourBtn) disableOneHourBtn.disabled = !enabled;
  }

  loadSettings().then((settings) => {
    const currentSettings = { ...settings };
    const applyEffectiveState = () => {
      const effectiveEnabled = isEffectivelyEnabled(currentSettings);
      if (extensionEnabledEl) extensionEnabledEl.checked = effectiveEnabled;
      updateQuickTogglesState(effectiveEnabled);
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

    quickKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;

      input.checked = Boolean(currentSettings[key]);
      input.addEventListener("change", () => {
        currentSettings[key] = input.checked;
        saveSettings(currentSettings);
      });
    });

    bindOptionsButton();
  });
})();
