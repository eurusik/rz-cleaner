(function () {
  "use strict";

  if (globalThis.__RZC_CONTENT_BOOTSTRAP__) return;
  globalThis.__RZC_CONTENT_BOOTSTRAP__ = true;

  if (!globalThis.RZCContentCore || typeof globalThis.RZCContentCore.init !== "function") {
    return;
  }

  globalThis.RZCContentCore.init();
})();
