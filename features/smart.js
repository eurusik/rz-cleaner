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
      }
    ];
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.smart = { run, reconcile, diagnostics };
})();
