(function () {
  "use strict";

  const HIDDEN_ATTR = "data-rz-clean-hidden";

  const widgetSelectors = [
    "rz-chat-bot-button-assist.right-assist",
    "rz-chat-bot-button-assist",
    "rz-chat-bot-button-assist .button-long",
    '[class*="rozetka-ai"]',
    '[id*="rozetka-ai"]',
    '[class*="chat-widget"]',
    '[id*="chat-widget"]',
    '[class*="widget"][style*="position: fixed"]',
    '[id*="widget"][style*="position: fixed"]'
  ];

  function hideElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (el.getAttribute(HIDDEN_ATTR) === "1") return;
    el.setAttribute(HIDDEN_ATTR, "1");
    el.style.setProperty("display", "none", "important");
  }

  function hidePromoPrices(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const promoNodes = scope.querySelectorAll(
      'rz-product-tile button.red-label, rz-product-tile [data-testid="promo-price"], rz-red-price, rz-red-price .red-price-container, rz-product-banner, rz-product-banner .product-banner'
    );
    promoNodes.forEach((node) => {
      const removable =
        node.closest("button.red-label") ||
        node.closest("rz-product-banner") ||
        node.closest("rz-red-price") ||
        node;
      hideElement(removable);
    });
  }

  function hideRozetkaAIWidget(root) {
    const scope = root && root.querySelectorAll ? root : document;

    widgetSelectors.forEach((selector) => {
      scope.querySelectorAll(selector).forEach((el) => {
        const text = (el.textContent || "").toLowerCase();
        if (
          selector.startsWith("rz-chat-bot-button-assist") ||
          text.includes("rozetka ai")
        ) {
          hideElement(el);
          hideElement(el.closest("rz-chat-bot-button-assist"));
        }
      });
    });

    const textNodes = scope.querySelectorAll("button, a, div, span");
    textNodes.forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!text.includes("rozetka ai")) return;

      const style = window.getComputedStyle(el);
      const isFloating =
        style.position === "fixed" ||
        style.position === "sticky" ||
        style.zIndex !== "auto";

      if (isFloating) {
        hideElement(el);
        hideElement(el.closest("button, a, div"));
      }
    });
  }

  function runCleanup(root) {
    hidePromoPrices(root);
    hideRozetkaAIWidget(root);
  }

  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          runCleanup(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  runCleanup(document);
  initObserver();
})();
