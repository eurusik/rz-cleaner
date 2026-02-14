(function () {
  "use strict";

  const existing = globalThis.RZCTileGalleryBridgeProtocol || {};

  globalThis.RZCTileGalleryBridgeProtocol = {
    SOURCE: existing.SOURCE || "RZC_PAGE_BRIDGE",
    TYPE: existing.TYPE || "RZC_TILE_GALLERY_PRODUCTS",
    REQUEST_SOURCE: existing.REQUEST_SOURCE || "RZC_TILE_GALLERY_CONTENT",
    REQUEST_TYPE: existing.REQUEST_TYPE || "RZC_TILE_GALLERY_REQUEST_SNAPSHOT"
  };
})();
