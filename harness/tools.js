import {
  normalizeCorner,
  nearestCorner,
  clampDockPosition,
} from "./tool-position.js";

export function setupPlaygroundTools() {
  const dock = document.getElementById("tool-dock");
  const handle = document.getElementById("controls-toggle");
  const panel = document.getElementById("controls");
  const picker = document.getElementById("tools-corner");
  const intro = document.getElementById("intro-notice");
  const key = "arkeid.playground.tools-corner.v1";
  let corner = "bottom-right";
  try {
    corner = normalizeCorner(localStorage.getItem(key));
  } catch {
    /* Storage is optional for the platform UI. */
  }
  function position(value, save = true) {
    corner = normalizeCorner(value);
    dock.dataset.corner = corner;
    panel.dataset.corner = corner;
    intro.dataset.corner = corner;
    picker.value = corner;
    dock.style.removeProperty("left");
    dock.style.removeProperty("top");
    dock.style.removeProperty("right");
    dock.style.removeProperty("bottom");
    if (save) {
      try {
        localStorage.setItem(key, corner);
      } catch {
        /* Keep working without persistence. */
      }
    }
  }
  function show(open, focus = false) {
    panel.hidden = !open;
    handle.setAttribute("aria-expanded", String(open));
    if (open) {
      intro.hidden = true;
      if (focus) document.getElementById("controls-close").focus();
    } else if (focus) handle.focus();
  }
  position(corner, false);
  let timer;
  function hideIntro() {
    if (intro.contains(document.activeElement)) {
      timer = setTimeout(hideIntro, 1000);
      return;
    }
    intro.classList.add("dismissed");
    timer = setTimeout(() => {
      intro.hidden = true;
    }, 180);
  }
  timer = setTimeout(hideIntro, 4000);
  document.getElementById("intro-dismiss").addEventListener("click", () => {
    clearTimeout(timer);
    intro.hidden = true;
    handle.focus();
  });
  document
    .getElementById("controls-close")
    .addEventListener("click", () => show(false, true));
  picker.addEventListener("change", () => position(picker.value));
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !panel.hidden &&
      !document.querySelector("dialog[open]")
    ) {
      event.preventDefault();
      show(false, true);
    }
  });
  document
    .getElementById("wallet-button")
    .addEventListener("click", () => show(false));
  document.addEventListener("pointerdown", (event) => {
    if (
      !panel.hidden &&
      !panel.contains(event.target) &&
      !dock.contains(event.target)
    )
      show(false);
  });
  let drag = null,
    suppressClick = false;
  handle.addEventListener("click", (event) => {
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      return;
    }
    show(panel.hidden, event.detail === 0);
  });
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick = false;
    const rect = dock.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    show(false);
    intro.hidden = true;
    dock.classList.add("dragging");
    const point = clampDockPosition(
      drag.left + dx,
      drag.top + dy,
      drag.width,
      drag.height,
      window.innerWidth,
      window.innerHeight,
    );
    dock.style.left = `${point.left}px`;
    dock.style.top = `${point.top}px`;
    dock.style.right = "auto";
    dock.style.bottom = "auto";
  });
  handle.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    if (drag.moved) {
      const rect = dock.getBoundingClientRect();
      position(
        nearestCorner(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          window.innerWidth,
          window.innerHeight,
        ),
      );
    }
    drag = null;
    dock.classList.remove("dragging");
    if (handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
  });
  handle.addEventListener("pointercancel", () => {
    drag = null;
    dock.classList.remove("dragging");
    position(corner, false);
  });
  handle.addEventListener("lostpointercapture", () => {
    if (drag) {
      drag = null;
      dock.classList.remove("dragging");
      position(corner, false);
    }
  });
  window.addEventListener("resize", () => {
    drag = null;
    dock.classList.remove("dragging");
    position(corner, false);
  });
}
