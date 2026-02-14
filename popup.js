(function () {
  "use strict";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DEFAULTS = CONFIG.defaults || {};
  const ENABLED_KEY = "enabled";
  const statusEl = document.getElementById("status");
  const extensionEnabledEl = document.getElementById("extensionEnabled");
  const togglesEl = document.querySelector(".toggles");

  const quickKeys = [
    "hideAdvertisingSections",
    "hideSmartDeliveryBadge",
    "hideEmailSubscriptionBanner",
    "hidePromoBlocks",
    "hideRedBonusBlocks",
    "hideRozetkaAI",
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
        resolve({ ...DEFAULTS, [ENABLED_KEY]: true });
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

        const merged = { ...DEFAULTS, ...legacy, ...namespaced };
        if (!(ENABLED_KEY in merged)) merged[ENABLED_KEY] = true;
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

  function updateQuickTogglesState(enabled) {
    if (togglesEl) togglesEl.classList.toggle("is-disabled", !enabled);
    quickKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;
      input.disabled = !enabled;
    });
  }

  loadSettings().then((settings) => {
    const currentSettings = { ...settings };

    if (extensionEnabledEl) {
      extensionEnabledEl.checked = currentSettings[ENABLED_KEY] !== false;
      updateQuickTogglesState(extensionEnabledEl.checked);
      extensionEnabledEl.addEventListener("change", () => {
        currentSettings[ENABLED_KEY] = extensionEnabledEl.checked;
        updateQuickTogglesState(extensionEnabledEl.checked);
        saveSettings(currentSettings);
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
