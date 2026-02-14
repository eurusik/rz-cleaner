(function () {
  "use strict";

  function advertisingRules(ctx) {
    return ctx.SELECTORS.advertising || [];
  }

  function quickFiltersRules(ctx) {
    return ctx.SELECTORS.quickFilters || [];
  }

  function hideAdvertisingSections(ctx, root, settings) {
    if (!settings.hideAdvertisingSections) return;
    const scope = root && root.querySelectorAll ? root : document;
    const matchedBySelectors = ctx.hideRuleSelectors(root, advertisingRules(ctx), ctx.FEATURE.ADVERTISING);

    function getAdCardContainer(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
      const wrapper = node.closest("div.item, [rzscrollslideritem], [data-testid='section-slide'], li");
      if (wrapper) return wrapper;
      return node.closest("rz-product-tile");
    }

    function promoteAdNodesToCardContainers() {
      const markedAdNodes = ctx.safeQueryAll(scope, `[${ctx.HIDDEN_FEATURES_ATTR}*=\"${ctx.FEATURE.ADVERTISING}\"]`);
      markedAdNodes.forEach((node) => {
        const featureSet = ctx.parseFeatureSet(node);
        if (!featureSet.has(ctx.FEATURE.ADVERTISING)) return;
        const container = getAdCardContainer(node);
        if (container) ctx.hideElement(container, ctx.FEATURE.ADVERTISING);
      });
    }

    promoteAdNodesToCardContainers();
    if (matchedBySelectors) return;

    if (scope !== document && !ctx.textContainsAny(scope.textContent || "", settings.advertisingTextList)) return;

    const sectionTitles = ctx.safeQueryAll(scope, "rz-section-slider .title, rz-section-slider h2");
    sectionTitles.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.advertisingTextList)) return;
      ctx.hideElement(el.closest("rz-section-slider"), ctx.FEATURE.ADVERTISING);
    });

    const adInfoNodes = ctx.safeQueryAll(scope, "rz-product-tile rz-tile-info, rz-tile-info");
    adInfoNodes.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.advertisingTextList)) return;
      ctx.hideElement(getAdCardContainer(el), ctx.FEATURE.ADVERTISING);
    });

    const sponsoredLinks = ctx.safeQueryAll(
      scope,
      "rz-product-tile a[rel~='sponsored'], rz-product-tile a[href*='advToken='], rz-product-tile a[href*='advSource=']"
    );
    sponsoredLinks.forEach((el) => {
      ctx.hideElement(getAdCardContainer(el), ctx.FEATURE.ADVERTISING);
    });

    promoteAdNodesToCardContainers();
  }

  function hideQuickFilters(ctx, root, settings) {
    if (!settings.hideQuickFilters) return;
    const scope = root && root.querySelectorAll ? root : document;
    const matchedBySelectors = ctx.hideRuleSelectors(root, quickFiltersRules(ctx), ctx.FEATURE.QUICK_FILTERS);
    if (matchedBySelectors) return;

    if (scope !== document && !ctx.textContainsAny(scope.textContent || "", settings.quickFiltersTextList)) return;

    const sectionTitles = ctx.safeQueryAll(scope, "rz-product-anchor-links .title, rz-product-anchor-links h2");
    sectionTitles.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.quickFiltersTextList)) return;
      ctx.hideElement(el.closest("rz-product-anchor-links"), ctx.FEATURE.QUICK_FILTERS);
    });
  }

  function run(ctx, root, settings) {
    hideAdvertisingSections(ctx, root, settings);
    hideQuickFilters(ctx, root, settings);
  }

  function reconcile(ctx, prevSettings, nextSettings) {
    if (prevSettings.hideAdvertisingSections && !nextSettings.hideAdvertisingSections) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.ADVERTISING);
    }
    if (prevSettings.hideQuickFilters && !nextSettings.hideQuickFilters) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.QUICK_FILTERS);
    }
    if (prevSettings.advertisingTexts !== nextSettings.advertisingTexts) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.ADVERTISING);
    }
    if (prevSettings.quickFiltersTexts !== nextSettings.quickFiltersTexts) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.QUICK_FILTERS);
    }
  }

  function diagnostics(ctx, settings, scope, extensionEnabled, pageText) {
    return [
      {
        id: ctx.FEATURE.ADVERTISING,
        enabled: extensionEnabled && Boolean(settings.hideAdvertisingSections),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, advertisingRules(ctx)),
        textMatch: ctx.hasTextFallbackSignal(pageText, settings.advertisingTextList)
      },
      {
        id: ctx.FEATURE.QUICK_FILTERS,
        enabled: extensionEnabled && Boolean(settings.hideQuickFilters),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, quickFiltersRules(ctx)),
        textMatch: ctx.hasTextFallbackSignal(pageText, settings.quickFiltersTextList)
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.ads = { run, reconcile, diagnostics };
})();
