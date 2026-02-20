(function () {
  "use strict";

  const RICH_BLOCK_SELECTOR = "rz-store-rich-content, rz-rich-content";
  const RICH_CONTENT_SELECTOR = ".rich-content, .rich";
  const MIN_RICH_TEXT_LENGTH = 180;

  function findBestRichContent(ctx, block) {
    const candidates = ctx.safeQueryAll(block, RICH_CONTENT_SELECTOR);
    if (!candidates || !candidates.length) return null;

    let best = null;
    let bestLength = 0;

    candidates.forEach((node) => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      const length = (node.textContent || "").trim().length;
      if (length > bestLength) {
        best = node;
        bestLength = length;
      }
    });

    if (!best || bestLength < MIN_RICH_TEXT_LENGTH) return null;
    return best;
  }

  function updateRichToggleText(button, expanded) {
    if (!button) return;
    button.textContent = expanded ? "Сховати повний опис" : "Показати повний опис";
  }

  function setupRichContentSpoiler(ctx, block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) return;
    if (block.getAttribute(ctx.RICH_COLLAPSIBLE_ATTR) === "1") return;

    const content = findBestRichContent(ctx, block);
    if (!content) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rzc-rich-toggle";
    toggle.setAttribute(ctx.RICH_TOGGLE_ATTR, "1");

    const onToggle = () => {
      const isCollapsed = block.classList.contains("rzc-rich-collapsed");
      if (isCollapsed) {
        block.classList.remove("rzc-rich-collapsed");
        updateRichToggleText(toggle, true);
      } else {
        block.classList.add("rzc-rich-collapsed");
        updateRichToggleText(toggle, false);
      }
    };
    toggle.addEventListener("click", onToggle);

    block.classList.add("rzc-rich-collapsed");
    block.setAttribute(ctx.RICH_COLLAPSIBLE_ATTR, "1");
    updateRichToggleText(toggle, false);
    block.appendChild(toggle);
  }

  function applyRichContentSpoilers(ctx, root) {
    const scope = root && root.querySelectorAll ? root : document;
    ctx.safeQueryAll(scope, RICH_BLOCK_SELECTOR).forEach((block) => setupRichContentSpoiler(ctx, block));
  }

  function removeRichContentSpoilers(ctx, root) {
    const scope = root && root.querySelectorAll ? root : document;
    ctx.safeQueryAll(scope, RICH_BLOCK_SELECTOR).forEach((block) => {
      block.classList.remove("rzc-rich-collapsed");
      block.removeAttribute(ctx.RICH_COLLAPSIBLE_ATTR);
      ctx.safeQueryAll(block, `[${ctx.RICH_TOGGLE_ATTR}]`).forEach((btn) => {
        if (!btn) return;
        if (typeof btn.remove === "function") {
          btn.remove();
          return;
        }
        if (btn.parentElement && Array.isArray(btn.parentElement.children)) {
          const parent = btn.parentElement;
          const idx = parent.children.indexOf(btn);
          if (idx >= 0) parent.children.splice(idx, 1);
          return;
        }
        btn.setAttribute("hidden", "hidden");
      });
    });
  }

  function run(ctx, root) {
    applyRichContentSpoilers(ctx, root);
  }

  function onDisabled(ctx, root) {
    removeRichContentSpoilers(ctx, root);
  }

  globalThis.RZCFeatures = globalThis.RZCFeatures || {};
  globalThis.RZCFeatures.richContentSpoiler = {
    run,
    onDisabled,
    applyRichContentSpoilers,
    removeRichContentSpoilers
  };
})();
