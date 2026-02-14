(function () {
  "use strict";

  function aiButtonSelectors(ctx) {
    return ctx.SELECTORS.aiButton || ctx.SELECTORS.ai || [];
  }

  function aiConsultationSelectors(ctx) {
    return ctx.SELECTORS.aiConsultation || [];
  }

  function popularSearchChipsRules(ctx) {
    return ctx.SELECTORS.popularSearchChips || [];
  }

  function hideRozetkaAIWidget(ctx, root, settings) {
    if (!settings.hideRozetkaAI) return;
    const scope = root && root.querySelectorAll ? root : document;
    const matchedBySelectors = ctx.hideSelectorList(
      root,
      aiButtonSelectors(ctx),
      ctx.FEATURE.AI_BUTTON,
      ["rz-chat-bot-button-assist"]
    );

    if (matchedBySelectors) return;
    if (scope !== document && !ctx.textContainsAny(scope.textContent || "", settings.aiButtonTextList)) return;

    const textNodes = ctx.safeQueryAll(scope, ctx.SELECTORS.aiTextNodes || "button, a, div, span");
    textNodes.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.aiButtonTextList)) return;

      const style = window.getComputedStyle(el);
      const isFloating =
        style.position === "fixed" ||
        style.position === "sticky" ||
        style.zIndex !== "auto";

      if (isFloating) {
        ctx.hideElement(el, ctx.FEATURE.AI_BUTTON);
        ctx.hideElement(el.closest("button, a, div"), ctx.FEATURE.AI_BUTTON);
      }
    });
  }

  function hideAiConsultationBlock(ctx, root, settings) {
    if (!settings.hideAiConsultationBlock) return;
    const scope = root && root.querySelectorAll ? root : document;
    const matchedBySelectors = ctx.hideSelectorList(
      root,
      aiConsultationSelectors(ctx),
      ctx.FEATURE.AI_CONSULT,
      ["rz-chat-bot-button-placeholder"]
    );

    if (matchedBySelectors) return;

    if (scope !== document && !ctx.textContainsAny(scope.textContent || "", settings.aiConsultationTextList)) return;

    const textNodes = ctx.safeQueryAll(scope, ctx.SELECTORS.aiTextNodes || "button, a, div, span");
    textNodes.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.aiConsultationTextList)) return;
      ctx.hideElement(el, ctx.FEATURE.AI_CONSULT);
      ctx.hideElement(el.closest("rz-chat-bot-button-placeholder"), ctx.FEATURE.AI_CONSULT);
    });
  }

  function hidePopularSearchChips(ctx, root, settings) {
    if (!settings.hidePopularSearchChips) return;
    const scope = root && root.querySelectorAll ? root : document;
    const matchedBySelectors = ctx.hideRuleSelectors(root, popularSearchChipsRules(ctx), ctx.FEATURE.POPULAR_SEARCH_CHIPS);

    if (matchedBySelectors) return;

    if (scope !== document && !ctx.textContainsAny(scope.textContent || "", settings.popularSearchTextList)) return;

    const textNodes = ctx.safeQueryAll(scope, "div, p, span, h2, h3, h4");
    textNodes.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!ctx.textContainsAny(text, settings.popularSearchTextList)) return;

      const parent = el.parentElement;
      if (parent && ctx.safeQueryAll(parent, "rz-tag-list, .tags-list").length) {
        ctx.hideElement(parent, ctx.FEATURE.POPULAR_SEARCH_CHIPS);
        return;
      }

      const block = el.closest("div");
      if (block && ctx.safeQueryAll(block, "rz-tag-list, .tags-list").length) {
        ctx.hideElement(block, ctx.FEATURE.POPULAR_SEARCH_CHIPS);
      }
    });
  }

  function run(ctx, root, settings) {
    hideRozetkaAIWidget(ctx, root, settings);
    hideAiConsultationBlock(ctx, root, settings);
    hidePopularSearchChips(ctx, root, settings);
  }

  function reconcile(ctx, prevSettings, nextSettings) {
    if (prevSettings.hideRozetkaAI && !nextSettings.hideRozetkaAI) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.AI_BUTTON);
    }
    if (prevSettings.hideAiConsultationBlock && !nextSettings.hideAiConsultationBlock) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.AI_CONSULT);
    }
    if (prevSettings.hidePopularSearchChips && !nextSettings.hidePopularSearchChips) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.POPULAR_SEARCH_CHIPS);
    }
    if (prevSettings.aiButtonTexts !== nextSettings.aiButtonTexts) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.AI_BUTTON);
    }
    if (prevSettings.aiConsultationTexts !== nextSettings.aiConsultationTexts) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.AI_CONSULT);
    }
    if (prevSettings.popularSearchTexts !== nextSettings.popularSearchTexts) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.POPULAR_SEARCH_CHIPS);
    }
  }

  function diagnostics(ctx, settings, scope, extensionEnabled, pageText) {
    return [
      {
        id: ctx.FEATURE.AI_BUTTON,
        enabled: extensionEnabled && Boolean(settings.hideRozetkaAI),
        selectorMatches: ctx.countUniqueMatchesBySelectors(scope, aiButtonSelectors(ctx)),
        textMatch: ctx.hasTextFallbackSignal(pageText, settings.aiButtonTextList)
      },
      {
        id: ctx.FEATURE.AI_CONSULT,
        enabled: extensionEnabled && Boolean(settings.hideAiConsultationBlock),
        selectorMatches: ctx.countUniqueMatchesBySelectors(scope, aiConsultationSelectors(ctx)),
        textMatch: ctx.hasTextFallbackSignal(pageText, settings.aiConsultationTextList)
      },
      {
        id: ctx.FEATURE.POPULAR_SEARCH_CHIPS,
        enabled: extensionEnabled && Boolean(settings.hidePopularSearchChips),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, popularSearchChipsRules(ctx)),
        textMatch: ctx.hasTextFallbackSignal(pageText, settings.popularSearchTextList)
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.ai = { run, reconcile, diagnostics };
})();
