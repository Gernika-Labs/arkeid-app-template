export const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];
export const DEFAULT_CORNER = "bottom-right";
export function normalizeCorner(value) {
  return CORNERS.includes(value) ? value : DEFAULT_CORNER;
}
export function nearestCorner(x, y, width, height) {
  return `${y < height / 2 ? "top" : "bottom"}-${x < width / 2 ? "left" : "right"}`;
}
export function clampDockPosition(
  left,
  top,
  dockWidth,
  dockHeight,
  width,
  height,
) {
  const margin = 16;
  return {
    left: Math.max(margin, Math.min(left, width - dockWidth - margin)),
    top: Math.max(margin, Math.min(top, height - dockHeight - margin)),
  };
}
