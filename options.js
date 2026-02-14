(function () {
  "use strict";

  const CONFIG = globalThis.RZC_CONFIG || {};
  const STORAGE_KEY = CONFIG.storageKey || "rzc_settings";
  const DIAGNOSTICS_STORAGE_KEY = `${STORAGE_KEY}_diagnostics`;
  const DEFAULTS = CONFIG.defaults || {};
  const SELECTORS = CONFIG.selectors || { promo: [], ai: [], aiTextNodes: "" };
  const ENABLED_KEY = "enabled";
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
  const extensionEnabledEl = document.getElementById("extensionEnabled");
  const applyRecommendedSettingsBtn = document.getElementById("applyRecommendedSettings");
  const resetFallbackBtn = document.getElementById("resetFallbackTexts");
  const resetCustomSelectorsBtn = document.getElementById("resetCustomSelectors");
  const copyActiveSelectorsBtn = document.getElementById("copyActiveSelectors");
  const copyActiveSelectorsStatusEl = document.getElementById("copyActiveSelectorsStatus");
  const runDiagnosticsNowBtn = document.getElementById("runDiagnosticsNow");
  const diagnosticsSummaryEl = document.getElementById("diagnosticsSummary");
  const diagnosticsMetaEl = document.getElementById("diagnosticsMeta");
  const diagnosticsListEl = document.getElementById("diagnosticsList");
  const refreshDiagnosticsBtn = document.getElementById("refreshDiagnostics");
  const diagnosticsDetailsEl = document.querySelector(".diagnostics-details");
  const checkboxKeys = Object.keys(DEFAULTS).filter((k) => typeof DEFAULTS[k] === "boolean");
  const textKeys = Object.keys(DEFAULTS).filter((k) => typeof DEFAULTS[k] === "string");
  const FEATURE_LABELS = {
    "promo-main": "Додаткова ціна “за Карткою Rozetka”",
    "promo-labels": "Promo-бейджі (ТОП ПРОДАЖІВ / НОВИНКА / -%)",
    "product-pictograms": "Піктограми в картці товару",
    "red-bonus": "Бонусні блоки за оплату карткою",
    "bonus-points": "Рядок “+ N бонусних ₴”",
    advertising: "Рекламні каруселі та рекламні картки",
    "quick-filters": "Блок “Швидкі фільтри”",
    "ai-button": "Кнопка Rozetka AI",
    "ai-consultation": "Картка “Потрібна консультація?”",
    "popular-search-chips": "Блок “Популярні запити”",
    "smart-delivery-badge": "Smart-блоки (бейдж + підписка Smart)",
    "email-subscription-banner": "Банер підписки на email",
    "super-offer": "Блок “Рекомендуємо” (Super Offer)",
    "product-services": "Блок “Додаткові послуги”",
    "sticky-product-carriage": "Нижня плаваюча панель кошика",
    "promotion-product": "Акційний блок під товаром",
    "tile-gallery": "Галерея на картках",
    "normalize-price-layout": "Компактні ціни в картках",
    custom: "Додаткові CSS-селектори"
  };
  const FEATURE_SETTING_KEYS = {
    "promo-main": "hidePromoBlocks",
    "promo-labels": "hidePromoLabels",
    "product-pictograms": "hideProductPictograms",
    "red-bonus": "hideRedBonusBlocks",
    "bonus-points": "hideBonusPoints",
    advertising: "hideAdvertisingSections",
    "quick-filters": "hideQuickFilters",
    "ai-button": "hideRozetkaAI",
    "ai-consultation": "hideAiConsultationBlock",
    "popular-search-chips": "hidePopularSearchChips",
    "smart-delivery-badge": "hideSmartDeliveryBadge",
    "email-subscription-banner": "hideEmailSubscriptionBanner",
    "super-offer": "hideSuperOffer",
    "product-services": "hideProductServices",
    "sticky-product-carriage": "hideStickyProductCarriage",
    "promotion-product": "hidePromotionProduct",
    "tile-gallery": "enableTileGallery",
    "normalize-price-layout": "normalizePriceLayout",
    custom: "customHideSelectors"
  };
  let statusTimer = 0;
  let saveTimer = 0;
  let copyStatusTimer = 0;
  let currentSettings = { ...DEFAULTS, [ENABLED_KEY]: true };

  function renderDiagnosticsEmpty(message) {
    if (diagnosticsSummaryEl) diagnosticsSummaryEl.textContent = message;
    if (diagnosticsMetaEl) diagnosticsMetaEl.textContent = "";
    if (diagnosticsListEl) diagnosticsListEl.innerHTML = "";
  }

  function getDiagnosticsStatusLabel(status) {
    if (status === "ok") return { text: "OK", className: "diag-badge diag-badge-ok" };
    if (status === "warning") return { text: "Перевірити", className: "diag-badge diag-badge-warn" };
    if (status === "not_on_page") return { text: "Немає на сторінці", className: "diag-badge diag-badge-info" };
    if (status === "not_configured") return { text: "Не налаштовано", className: "diag-badge diag-badge-info" };
    if (status === "stale") return { text: "Оновіть сторінку", className: "diag-badge diag-badge-warn" };
    return { text: "Неактивно", className: "diag-badge diag-badge-off" };
  }

  function isFeatureEnabledInCurrentOptions(featureId) {
    if (currentSettings[ENABLED_KEY] === false) return false;
    const key = FEATURE_SETTING_KEYS[featureId];
    if (!key) return false;

    if (key === "customHideSelectors") {
      return getCustomSelectors(currentSettings.customHideSelectors).length > 0;
    }

    return Boolean(currentSettings[key]);
  }

  function normalizeFeatureStatus(feature) {
    const expectedEnabled = isFeatureEnabledInCurrentOptions(feature.id);
    const rawStatus = feature.status || "disabled";

    if (expectedEnabled) {
      if (rawStatus === "disabled" || rawStatus === "not_configured") {
        return "stale";
      }
      return rawStatus;
    }

    if (feature.id === "custom") {
      return "not_configured";
    }

    if (rawStatus === "ok" || rawStatus === "warning" || rawStatus === "not_on_page") {
      return "stale";
    }
    return "disabled";
  }

  function renderDiagnostics(data) {
    if (!data || !Array.isArray(data.features)) {
      renderDiagnosticsEmpty("Відкрийте будь-яку сторінку Rozetka і оновіть її, щоб побачити статус.");
      return;
    }

    const updatedAt = typeof data.updatedAt === "number" ? new Date(data.updatedAt) : null;
    const features = data.features.map((feature) => ({
      ...feature,
      uiStatus: normalizeFeatureStatus(feature)
    }));
    const enabledCount = features.filter((f) => isFeatureEnabledInCurrentOptions(f.id)).length;
    const warningCount = features.filter((f) => f.uiStatus === "warning").length;
    const staleCount = features.filter((f) => f.uiStatus === "stale").length;
    const notOnPageCount = features.filter((f) => f.uiStatus === "not_on_page").length;

    if (diagnosticsSummaryEl) {
      if (!enabledCount) {
        diagnosticsSummaryEl.textContent = "Усі функції вимкнені або на сторінці немає елементів для перевірки.";
      } else if (staleCount > 0) {
        diagnosticsSummaryEl.textContent = "Частина даних застаріла. Відкрийте Rozetka і оновіть сторінку, потім натисніть “Оновити статус”.";
      } else if (warningCount > 0) {
        diagnosticsSummaryEl.textContent = `Є ${warningCount} пункт(и), які варто перевірити: елементи знайдені, але не були приховані.`;
      } else if (notOnPageCount > 0) {
        diagnosticsSummaryEl.textContent = "Критичних проблем не знайдено. Частини блоків просто немає на цій сторінці.";
      } else {
        diagnosticsSummaryEl.textContent = "Все виглядає добре: активні функції знаходять свої елементи.";
      }
    }

    if (diagnosticsMetaEl) {
      const host = data.host ? `Сторінка: ${data.host}` : "";
      const time = updatedAt ? `Оновлено: ${updatedAt.toLocaleString("uk-UA")}` : "";
      diagnosticsMetaEl.textContent = [host, time].filter(Boolean).join(" | ");
    }

    if (!diagnosticsListEl) return;
    diagnosticsListEl.innerHTML = "";

    features.forEach((feature) => {
      const li = document.createElement("li");
      li.className = "diag-item";

      const head = document.createElement("div");
      head.className = "diag-item-head";

      const title = document.createElement("span");
      title.className = "diag-title";
      title.textContent = FEATURE_LABELS[feature.id] || feature.id || "Невідома функція";

      const badge = document.createElement("span");
      const badgeInfo = getDiagnosticsStatusLabel(feature.uiStatus);
      badge.className = badgeInfo.className;
      badge.textContent = badgeInfo.text;

      head.appendChild(title);
      head.appendChild(badge);

      const details = document.createElement("p");
      details.className = "diag-details";
      if (feature.uiStatus === "disabled") {
        details.textContent = "Цю функцію вимкнено у блоці “Швидкі налаштування”.";
      } else if (feature.uiStatus === "not_configured") {
        details.textContent = "Додайте власні CSS-селектори в полі “Додаткові CSS-селектори для приховування”.";
      } else if (feature.uiStatus === "not_on_page") {
        details.textContent = "На поточній сторінці такого блоку немає. Це нормально.";
      } else if (feature.uiStatus === "stale") {
        details.textContent = "Статус застарів після змін у налаштуваннях. Оновіть сторінку Rozetka і натисніть “Оновити статус”.";
      } else {
        const selectorPart = `селектори: ${Number(feature.selectorMatches || 0)}`;
        const textPart =
          feature.textMatch === null || feature.textMatch === undefined
            ? "fallback-текст: -"
            : feature.textMatch
              ? "fallback-текст: знайдено"
              : "fallback-текст: не знайдено";
        const hiddenPart = `приховано: ${Number(feature.hiddenCount || 0)}`;
        details.textContent = `${selectorPart}; ${textPart}; ${hiddenPart}`;
      }

      li.appendChild(head);
      li.appendChild(details);
      diagnosticsListEl.appendChild(li);
    });
  }

  function loadDiagnostics() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        renderDiagnosticsEmpty("Діагностика недоступна в цьому середовищі.");
        resolve(null);
        return;
      }

      chrome.storage.local.get({ [DIAGNOSTICS_STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          renderDiagnosticsEmpty("Не вдалося прочитати діагностику.");
          resolve(null);
          return;
        }

        const diagnostics = stored[DIAGNOSTICS_STORAGE_KEY];
        renderDiagnostics(diagnostics);
        resolve(diagnostics || null);
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
    const bonusPoints = (SELECTORS.bonusPoints || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const promoLabels = (SELECTORS.promoLabels || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const productPictograms = (SELECTORS.productPictograms || [])
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
    const smartDeliveryBadge = (SELECTORS.smartDeliveryBadge || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const emailSubscriptionBanner = (SELECTORS.emailSubscriptionBanner || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const superOffer = (SELECTORS.superOffer || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const productServices = (SELECTORS.productServices || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const stickyProductCarriage = (SELECTORS.stickyProductCarriage || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);
    const promotionProduct = (SELECTORS.promotionProduct || [])
      .map((rule) => (rule && rule.query ? rule.query : ""))
      .filter(Boolean);

    return {
      promoMain,
      promoLabels,
      productPictograms,
      redBonus,
      bonusPoints,
      advertising,
      quickFilters,
      aiButton,
      aiConsultation,
      popularSearchChips,
      smartDeliveryBadge,
      emailSubscriptionBanner,
      superOffer,
      productServices,
      stickyProductCarriage,
      promotionProduct
    };
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
      "# Promo labels selectors (built-in)",
      ...builtIn.promoLabels,
      "",
      "# Product pictograms selectors (built-in)",
      ...builtIn.productPictograms,
      "",
      "# Red bonus selectors (built-in)",
      ...builtIn.redBonus,
      "",
      "# Bonus points selectors (built-in)",
      ...builtIn.bonusPoints,
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
      "# Smart delivery badge selectors (built-in)",
      ...builtIn.smartDeliveryBadge,
      "",
      "# Email subscription banner selectors (built-in)",
      ...builtIn.emailSubscriptionBanner,
      "",
      "# Super offer selectors (built-in)",
      ...builtIn.superOffer,
      "",
      "# Product services selectors (built-in)",
      ...builtIn.productServices,
      "",
      "# Sticky product carriage selectors (built-in)",
      ...builtIn.stickyProductCarriage,
      "",
      "# Promotion product selectors (built-in)",
      ...builtIn.promotionProduct,
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
    const isEnabled = settings[ENABLED_KEY] !== false;
    if (extensionEnabledEl) {
      extensionEnabledEl.checked = isEnabled;
    }

    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.checked = Boolean(settings[key]);
      el.disabled = !isEnabled;
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
        resolve({ ...DEFAULTS, [ENABLED_KEY]: true });
        return;
      }

      chrome.storage.sync.get({ ...DEFAULTS, [STORAGE_KEY]: null }, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({ ...DEFAULTS, [ENABLED_KEY]: true });
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

  function updateQuickSettingsState(enabled) {
    const quickPanel = document.querySelector(".panel");
    if (quickPanel) quickPanel.classList.toggle("is-disabled", !enabled);
    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      el.disabled = !enabled;
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

  async function copyTextToClipboard(text) {
    if (!text) return false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {}
    }

    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (err) {
      copied = false;
    }
    document.body.removeChild(temp);
    return copied;
  }

  function setCopyStatus(text, isError = false) {
    if (!copyActiveSelectorsStatusEl) return;
    copyActiveSelectorsStatusEl.textContent = text;
    copyActiveSelectorsStatusEl.classList.toggle("error", isError);
    copyActiveSelectorsStatusEl.classList.toggle("visible", Boolean(text));
    if (copyStatusTimer) window.clearTimeout(copyStatusTimer);
    copyStatusTimer = window.setTimeout(() => {
      copyStatusTimer = 0;
      copyActiveSelectorsStatusEl.textContent = "";
      copyActiveSelectorsStatusEl.classList.remove("error", "visible");
    }, 1400);
  }

  loadSettings().then((settings) => {
    currentSettings = settings;
    applySettingsToUI(currentSettings);
    updateQuickSettingsState(currentSettings[ENABLED_KEY] !== false);
    loadDiagnostics();

    if (extensionEnabledEl) {
      extensionEnabledEl.addEventListener("change", () => {
        currentSettings[ENABLED_KEY] = extensionEnabledEl.checked;
        updateQuickSettingsState(extensionEnabledEl.checked);
        scheduleSave(0);
      });
    }

    if (applyRecommendedSettingsBtn) {
      applyRecommendedSettingsBtn.addEventListener("click", () => {
        checkboxKeys.forEach((key) => {
          currentSettings[key] = Boolean(DEFAULTS[key]);
        });
        currentSettings[ENABLED_KEY] = true;
        applySettingsToUI(currentSettings);
        updateQuickSettingsState(true);
        scheduleSave(0);
        showStatus("Налаштування скинуто", "success");
      });
    }

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
        showStatus("Фрази скинуто до стандартних", "success");
      });
    }

    if (resetCustomSelectorsBtn) {
      resetCustomSelectorsBtn.addEventListener("click", () => {
        currentSettings[CUSTOM_SELECTOR_KEY] =
          typeof DEFAULTS[CUSTOM_SELECTOR_KEY] === "string" ? DEFAULTS[CUSTOM_SELECTOR_KEY] : "";
        applySettingsToUI(currentSettings);
        scheduleSave(0);
        showStatus("Користувацькі CSS очищено", "success");
      });
    }

    if (copyActiveSelectorsBtn) {
      copyActiveSelectorsBtn.addEventListener("click", async () => {
        const copied = await copyTextToClipboard(activeSelectorsEl ? activeSelectorsEl.value : "");
        if (copied) {
          setCopyStatus("Скопійовано");
          return;
        }
        setCopyStatus("Помилка", true);
      });
    }

    if (runDiagnosticsNowBtn) {
      runDiagnosticsNowBtn.addEventListener("click", () => {
        if (diagnosticsDetailsEl) diagnosticsDetailsEl.open = true;
        loadDiagnostics();
        showStatus("Статус оновлено", "success");
      });
    }

    if (refreshDiagnosticsBtn) {
      refreshDiagnosticsBtn.addEventListener("click", () => {
        loadDiagnostics();
      });
    }

    if (chrome.storage && chrome.storage.onChanged) {
      const onStorageChanged = (changes, areaName) => {
        if (areaName !== "local") return;
        if (!(DIAGNOSTICS_STORAGE_KEY in changes)) return;
        renderDiagnostics(changes[DIAGNOSTICS_STORAGE_KEY].newValue || null);
      };

      chrome.storage.onChanged.addListener(onStorageChanged);
      window.addEventListener(
        "pagehide",
        () => {
          chrome.storage.onChanged.removeListener(onStorageChanged);
        },
        { once: true }
      );
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingSave();
    }
  });
  window.addEventListener("pagehide", flushPendingSave, { once: true });
})();
