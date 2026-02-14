(function () {
  "use strict";

  globalThis.RZC_CONFIG = {
    storageKey: "rzc_settings",
    rootClassNormalizePrice: "rzc-normalize-price",
    hiddenClass: "rzc-hidden",
    defaults: {
      hidePromoBlocks: true,
      hidePromoLabels: true,
      hideProductPictograms: true,
      hideRedBonusBlocks: true,
      hideBonusPoints: true,
      hideAdvertisingSections: true,
      hideQuickFilters: true,
      hideRozetkaAI: true,
      hideAiConsultationBlock: true,
      hidePopularSearchChips: true,
      hideSmartDeliveryBadge: true,
      hideEmailSubscriptionBanner: true,
      hideSuperOffer: true,
      hideProductServices: true,
      hideStickyProductCarriage: true,
      hidePromotionProduct: true,
      enableTileGallery: true,
      normalizePriceLayout: true,
      aiButtonTexts: "rozetka ai",
      aiConsultationTexts: "потрібна консультація\nai-помічник",
      popularSearchTexts: "популярні запити",
      advertisingTexts: "реклама",
      quickFiltersTexts: "швидкі фільтри",
      customHideSelectors: ""
    },
    selectors: {
      promoMain: [
        { query: "rz-product-tile button.red-label" },
        { query: 'rz-product-tile [data-testid="promo-price"]', closest: "button.red-label" },
        { query: "rz-red-price" },
        { query: "rz-red-price .red-price-container", closest: "rz-red-price" },
        { query: "rz-product-banner" },
        { query: "rz-product-banner .product-banner", closest: "rz-product-banner" }
      ],
      promoLabels: [
        { query: "rz-product-tile rz-promo-label.tile-promo-label" },
        { query: "rz-product-tile rz-promo-label.promo-label" },
        { query: "rz-product-tile rz-promo-label[class*='promo-label_type_']" }
      ],
      productPictograms: [
        { query: "rz-product-tile rz-product-pictograms", closest: "rz-product-pictograms" },
        { query: "rz-product-pictograms", closest: "rz-product-pictograms" },
        { query: "rz-product-pictograms .item", closest: "rz-product-pictograms" }
      ],
      redBonus: [
        { query: "rz-tile-bonus .bonus__red", closest: "rz-tile-bonus" },
        { query: "rz-tile-bonus .red-icon", closest: "rz-tile-bonus" },
        { query: "rz-product-red-bonus" },
        { query: "rz-product-red-bonus .loyalty__red-card", closest: "rz-product-red-bonus" }
      ],
      bonusPoints: [
        { query: "rz-product-tile rz-tile-bonus", closest: "rz-tile-bonus" },
        { query: "rz-tile-bonus .bonus", closest: "rz-tile-bonus" },
        { query: "rz-tile-bonus use[href*='#icon-bonus']", closest: "rz-tile-bonus" }
      ],
      advertising: [
        { query: 'rz-section-slider[data-testid="advertising-slider"]' },
        { query: "rz-section-slider.advertising-slider-theme" },
        { query: "rz-section-slider rz-advertising-info-btn", closest: "rz-section-slider" },
        { query: "rz-product-tile a[rel~='sponsored']", closest: "div.item, [rzscrollslideritem], [data-testid='section-slide'], li, rz-product-tile" },
        { query: "rz-product-tile a[href*='advToken=']", closest: "div.item, [rzscrollslideritem], [data-testid='section-slide'], li, rz-product-tile" },
        { query: "rz-product-tile a[href*='advSource=']", closest: "div.item, [rzscrollslideritem], [data-testid='section-slide'], li, rz-product-tile" }
      ],
      quickFilters: [
        { query: "rz-product-anchor-links" },
        { query: "rz-product-anchor-links .product-anchor-links__list-wrapper", closest: "rz-product-anchor-links" },
        { query: "rz-product-anchor-links h2.title", closest: "rz-product-anchor-links" }
      ],
      aiButton: [
        "rz-chat-bot-button-assist.right-assist",
        "rz-chat-bot-button-assist",
        "rz-chat-bot-button-assist .button-long",
        '[class*="rozetka-ai"]',
        '[id*="rozetka-ai"]',
        '[class*="chat-widget"]',
        '[id*="chat-widget"]',
        '[class*="widget"][style*="position: fixed"]',
        '[id*="widget"][style*="position: fixed"]'
      ],
      aiConsultation: [
        "rz-chat-bot-button-placeholder",
        "rz-chat-bot-button-placeholder .invitation"
      ],
      popularSearchChips: [
        { query: "div.md\\:order-1 rz-tag-list.max-three-rows", closest: "div.md\\:order-1" },
        { query: "div.md\\:order-1 rz-tag-list .tags-list", closest: "div.md\\:order-1" },
        { query: "rz-tag-list.max-three-rows", closest: "div.md\\:order-1" }
      ],
      smartDeliveryBadge: [
        {
          query: "rz-product-tile use[href*='#icon-premium-smart']",
          closest: "div.d-flex.gap-1.items-center.text-xs.color-green"
        },
        {
          query: "rz-product-tile rz-smart-description-button",
          closest: "div.d-flex.gap-1.items-center.text-xs.color-green"
        },
        {
          query: "rz-product-tile .tile-smart-icon",
          closest: "div.d-flex.gap-1.items-center.text-xs.color-green"
        },
        {
          query: "rz-delivery-premium",
          closest: "rz-delivery-premium"
        },
        {
          query: "rz-delivery-premium .premium--title",
          closest: "rz-delivery-premium"
        },
        {
          query: "rz-delivery-premium use[href*='#icon-premium-smart']",
          closest: "rz-delivery-premium"
        },
        {
          query: "rz-delivery-price use[href*='#icon-premium-smart']",
          closest: "rz-delivery-price"
        },
        {
          query: "rz-delivery-price svg use[href*='#icon-premium-smart']",
          closest: "rz-delivery-price"
        }
      ],
      emailSubscriptionBanner: [
        { query: "rz-marketing-subscription-banner" },
        {
          query: "rz-marketing-subscription-banner .content",
          closest: "rz-marketing-subscription-banner"
        },
        {
          query: "rz-marketing-subscription-banner rz-modal-close-btn",
          closest: "rz-marketing-subscription-banner"
        }
      ],
      superOffer: [
        { query: "rz-super-offer" },
        { query: "rz-super-offer [data-testid='super-offer']", closest: "rz-super-offer" },
        { query: "rz-super-offer .super-offer", closest: "rz-super-offer" }
      ],
      productServices: [
        { query: "rz-product-services" },
        { query: "rz-product-services .additional-services-container", closest: "rz-product-services" },
        { query: "rz-product-services rz-additional-services", closest: "rz-product-services" }
      ],
      stickyProductCarriage: [
        { query: "rz-product-carriage", closest: "rz-product-carriage" },
        { query: "rz-product-carriage rz-sticky-buy", closest: "rz-product-carriage" },
        { query: "rz-product-carriage .carriage__main", closest: "rz-product-carriage" }
      ],
      promotionProduct: [
        { query: "rz-promotion-product", closest: "rz-promotion-product" },
        { query: "rz-promotion-product .product-promotion", closest: "rz-promotion-product" },
        { query: "rz-promotion-product .product-promotion__label", closest: "rz-promotion-product" }
      ],
      aiTextNodes: "button, a, div, span"
    }
  };
})();
