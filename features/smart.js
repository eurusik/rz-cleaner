(function () {
  "use strict";

  function smartDeliveryBadgeRules(ctx) {
    return ctx.SELECTORS.smartDeliveryBadge || [];
  }

  function emailSubscriptionBannerRules(ctx) {
    return ctx.SELECTORS.emailSubscriptionBanner || [];
  }

  function superOfferRules(ctx) {
    return ctx.SELECTORS.superOffer || [];
  }

  function productServicesRules(ctx) {
    return ctx.SELECTORS.productServices || [];
  }

  function stickyProductCarriageRules(ctx) {
    return ctx.SELECTORS.stickyProductCarriage || [];
  }

  function promotionProductRules(ctx) {
    return ctx.SELECTORS.promotionProduct || [];
  }

  function run(ctx, root, settings) {
    if (settings.hideSmartDeliveryBadge) {
      ctx.hideRuleSelectors(root, smartDeliveryBadgeRules(ctx), ctx.FEATURE.SMART_DELIVERY_BADGE);
    }
    if (settings.hideEmailSubscriptionBanner) {
      ctx.hideRuleSelectors(root, emailSubscriptionBannerRules(ctx), ctx.FEATURE.EMAIL_SUBSCRIPTION_BANNER);
    }
    if (settings.hideSuperOffer) {
      ctx.hideRuleSelectors(root, superOfferRules(ctx), ctx.FEATURE.SUPER_OFFER);
    }
    if (settings.hideProductServices) {
      ctx.hideRuleSelectors(root, productServicesRules(ctx), ctx.FEATURE.PRODUCT_SERVICES);
    }
    if (settings.hideStickyProductCarriage) {
      ctx.hideRuleSelectors(root, stickyProductCarriageRules(ctx), ctx.FEATURE.STICKY_PRODUCT_CARRIAGE);
    }
    if (settings.hidePromotionProduct) {
      ctx.hideRuleSelectors(root, promotionProductRules(ctx), ctx.FEATURE.PROMOTION_PRODUCT);
    }
  }

  function reconcile(ctx, prevSettings, nextSettings) {
    if (prevSettings.hideSmartDeliveryBadge && !nextSettings.hideSmartDeliveryBadge) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.SMART_DELIVERY_BADGE);
    }
    if (prevSettings.hideEmailSubscriptionBanner && !nextSettings.hideEmailSubscriptionBanner) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.EMAIL_SUBSCRIPTION_BANNER);
    }
    if (prevSettings.hideSuperOffer && !nextSettings.hideSuperOffer) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.SUPER_OFFER);
    }
    if (prevSettings.hideProductServices && !nextSettings.hideProductServices) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.PRODUCT_SERVICES);
    }
    if (prevSettings.hideStickyProductCarriage && !nextSettings.hideStickyProductCarriage) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.STICKY_PRODUCT_CARRIAGE);
    }
    if (prevSettings.hidePromotionProduct && !nextSettings.hidePromotionProduct) {
      ctx.removeFeatureFromAll(document, ctx.FEATURE.PROMOTION_PRODUCT);
    }
  }

  function diagnostics(ctx, settings, scope, extensionEnabled) {
    return [
      {
        id: ctx.FEATURE.SMART_DELIVERY_BADGE,
        enabled: extensionEnabled && Boolean(settings.hideSmartDeliveryBadge),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, smartDeliveryBadgeRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.EMAIL_SUBSCRIPTION_BANNER,
        enabled: extensionEnabled && Boolean(settings.hideEmailSubscriptionBanner),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, emailSubscriptionBannerRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.SUPER_OFFER,
        enabled: extensionEnabled && Boolean(settings.hideSuperOffer),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, superOfferRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.PRODUCT_SERVICES,
        enabled: extensionEnabled && Boolean(settings.hideProductServices),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, productServicesRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.STICKY_PRODUCT_CARRIAGE,
        enabled: extensionEnabled && Boolean(settings.hideStickyProductCarriage),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, stickyProductCarriageRules(ctx)),
        textMatch: null
      },
      {
        id: ctx.FEATURE.PROMOTION_PRODUCT,
        enabled: extensionEnabled && Boolean(settings.hidePromotionProduct),
        selectorMatches: ctx.countUniqueMatchesByRules(scope, promotionProductRules(ctx)),
        textMatch: null
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.smart = { run, reconcile, diagnostics };
})();
