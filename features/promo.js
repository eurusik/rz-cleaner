(function () {
  "use strict";

  function promoRules(ctx) {
    return ctx.SELECTORS.promoMain || ctx.SELECTORS.promo || [];
  }

  function promoLabelRules(ctx) {
    return ctx.SELECTORS.promoLabels || [];
  }

  function productPictogramsRules(ctx) {
    return ctx.SELECTORS.productPictograms || [];
  }

  function redBonusRules(ctx) {
    return ctx.SELECTORS.redBonus || [];
  }

  function bonusPointsRules(ctx) {
    return ctx.SELECTORS.bonusPoints || [];
  }

  function run(ctx, root, settings) {
    if (settings.hidePromoBlocks) {
      ctx.hideRuleSelectors(root, promoRules(ctx), ctx.FEATURE.PROMO_MAIN);
    }
    if (settings.hidePromoLabels) {
      ctx.hideRuleSelectors(root, promoLabelRules(ctx), ctx.FEATURE.PROMO_LABELS);
    }
    if (settings.hideProductPictograms) {
      ctx.hideRuleSelectors(root, productPictogramsRules(ctx), ctx.FEATURE.PRODUCT_PICTOGRAMS);
    }
    if (settings.hideRedBonusBlocks) {
      ctx.hideRuleSelectors(root, redBonusRules(ctx), ctx.FEATURE.RED_BONUS);
    }
    if (settings.hideBonusPoints) {
      ctx.hideRuleSelectors(root, bonusPointsRules(ctx), ctx.FEATURE.BONUS_POINTS);
    }
  }

  function reconcile(ctx, prevSettings, nextSettings) {
    if (prevSettings.hidePromoBlocks && !nextSettings.hidePromoBlocks) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.PROMO_MAIN);
    }
    if (prevSettings.hidePromoLabels && !nextSettings.hidePromoLabels) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.PROMO_LABELS);
    }
    if (prevSettings.hideProductPictograms && !nextSettings.hideProductPictograms) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.PRODUCT_PICTOGRAMS);
    }
    if (prevSettings.hideRedBonusBlocks && !nextSettings.hideRedBonusBlocks) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.RED_BONUS);
    }
    if (prevSettings.hideBonusPoints && !nextSettings.hideBonusPoints) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.BONUS_POINTS);
    }
  }

  function diagnostics(ctx, settings, scope, extensionEnabled) {
    return [
      {
        id: ctx.FEATURE.PROMO_MAIN,
        enabled: extensionEnabled && Boolean(settings.hidePromoBlocks),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, promoRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.PROMO_LABELS,
        enabled: extensionEnabled && Boolean(settings.hidePromoLabels),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, promoLabelRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.PRODUCT_PICTOGRAMS,
        enabled: extensionEnabled && Boolean(settings.hideProductPictograms),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, productPictogramsRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.RED_BONUS,
        enabled: extensionEnabled && Boolean(settings.hideRedBonusBlocks),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, redBonusRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.BONUS_POINTS,
        enabled: extensionEnabled && Boolean(settings.hideBonusPoints),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, bonusPointsRules(ctx)),
        textMatch: null
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.promo = { run, reconcile, diagnostics };
})();
