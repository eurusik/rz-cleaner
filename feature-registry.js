(function () {
  "use strict";

  function getModules() {
    const features = globalThis.RZCFeatures || {};
    return [features.promo, features.ads, features.ai, features.smart, features.richContentSpoiler].filter(Boolean);
  }

  function runFeatureCleanup(ctx, root, settings) {
    getModules().forEach((module) => {
      if (typeof module.run === "function") {
        module.run(ctx, root, settings);
      }
    });
  }

  function onDisabled(ctx, root) {
    getModules().forEach((module) => {
      if (typeof module.onDisabled === "function") {
        module.onDisabled(ctx, root);
      }
    });
  }

  function reconcile(ctx, prevSettings, nextSettings) {
    getModules().forEach((module) => {
      if (typeof module.reconcile === "function") {
        module.reconcile(ctx, prevSettings, nextSettings);
      }
    });
  }

  function diagnosticsEntries(ctx, settings, scope, extensionEnabled, pageText) {
    const entries = [];
    getModules().forEach((module) => {
      if (typeof module.diagnostics === "function") {
        entries.push(...module.diagnostics(ctx, settings, scope, extensionEnabled, pageText));
      }
    });
    return entries;
  }

  globalThis.RZCFeatureRegistry = {
    runFeatureCleanup,
    onDisabled,
    reconcile,
    diagnosticsEntries
  };
})();
