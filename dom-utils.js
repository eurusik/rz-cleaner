(function () {
  "use strict";

  // Shared DOM utility namespace for content modules.
  globalThis.RZCDomUtils = globalThis.RZCDomUtils || {
    safeQueryAll(scope, selector) {
      if (!scope || typeof scope.querySelectorAll !== "function") return [];
      try {
        return scope.querySelectorAll(selector);
      } catch (err) {
        return [];
      }
    },
    safeClosest(node, selector) {
      if (!node || typeof node.closest !== "function" || !selector) return null;
      try {
        return node.closest(selector);
      } catch (err) {
        return null;
      }
    },
    getTextList(raw, limit = 50) {
      if (typeof raw !== "string") return [];
      return raw
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, limit);
    },
    textContainsAny(text, list) {
      if (!text || !list || !list.length) return false;
      const normalized = String(text).toLowerCase();
      return list.some((needle) => normalized.includes(needle));
    }
  };
})();
