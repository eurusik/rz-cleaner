(function () {
  "use strict";

  function getFirstQuery(ctx, scope, selector) {
    const list = ctx.safeQueryAll(scope, selector);
    return list && list.length ? list[0] : null;
  }

  function updateRichToggleText(button, expanded) {
    if (!button) return;
    button.textContent = expanded ? "Сховати повний опис" : "Показати повний опис";
  }

  function setupRichContentSpoiler(ctx, block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) return;
    if (block.getAttribute(ctx.RICH_COLLAPSIBLE_ATTR) === "1") return;

    const content = getFirstQuery(ctx, block, ".rich-content");
    if (!content) return;
    if ((content.textContent || "").trim().length < 180) return;

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
    ctx.safeQueryAll(scope, "rz-store-rich-content").forEach((block) => setupRichContentSpoiler(ctx, block));
  }

  function removeRichContentSpoilers(ctx, root) {
    const scope = root && root.querySelectorAll ? root : document;
    ctx.safeQueryAll(scope, "rz-store-rich-content").forEach((block) => {
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
