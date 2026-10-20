/* Adapted from BeefTV v1.5.5 canvas-selection.ts and infinite-canvas.tsx.
 * MIT; copyright notices in BEEFTV-LICENSE.txt alongside this file.
 * No BeefTV service, store or model API is imported.
 */
export function resolveCanvasPointerIntent(input) {
  if (input.pointerType === "touch") return input.background ? "pan" : "ignore"
  if (input.button === 1) return "pan"
  if (input.button !== 0) return "ignore"
  if (input.spacePressed) return "pan"
  if (!input.background) return "ignore"
  if (input.boxSelectEnabled || input.altKey || input.ctrlKey || input.metaKey || input.shiftKey) return "select"
  return "pan"
}
export function resolveCanvasSelectionStrategy(modifiers) {
  if (modifiers.altKey) return "subtract"
  if (modifiers.ctrlKey || modifiers.metaKey) return "toggle"
  if (modifiers.shiftKey) return "add"
  return "replace"
}
export function applyCanvasSelectionStrategy(initialSelection, hitNodeIds, strategy) {
  const hits = Array.from(hitNodeIds)
  if (strategy === "replace") return new Set(hits)
  const next = new Set(initialSelection)
  for (const id of hits) {
    if (strategy === "add") next.add(id)
    else if (strategy === "subtract") next.delete(id)
    else if (next.has(id)) next.delete(id)
    else next.add(id)
  }
  return next
}
export function createCanvasSelectionBounds(x, y, cx, cy) {
  return { left: Math.min(x, cx), top: Math.min(y, cy), right: Math.max(x, cx), bottom: Math.max(y, cy) }
}
export function canvasSelectionHitsBounds(a, b) {
  return b.right > a.left && b.left < a.right && b.bottom > a.top && b.top < a.bottom
}
export function worldPoint(point, viewport) {
  return { x: (point.x - viewport.x) / viewport.k, y: (point.y - viewport.y) / viewport.k }
}
export function wheelViewport(viewport, event, point) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 720 : 1
  const dy = event.deltaY * unit
  const dx = event.deltaX * unit
  const mouseWheel = event.deltaMode !== 0 || (Math.abs(event.deltaY) >= 80 && Math.abs(event.deltaY - Math.round(event.deltaY / 100) * 100) < 1)
  if (!event.ctrlKey && (event.shiftKey || Math.abs(dx) > 0 || !mouseWheel)) {
    return { ...viewport, x: viewport.x - (event.shiftKey && !dx ? dy : dx), y: viewport.y - (event.shiftKey && !dx ? 0 : dy) }
  }
  const factor = Math.pow(1.1, -dy / (event.ctrlKey && !mouseWheel ? 24 : 72))
  const k = Math.max(0.05, Math.min(2, viewport.k * factor))
  const world = worldPoint(point, viewport)
  return { x: point.x - world.x * k, y: point.y - world.y * k, k }
}

export function canvasWireTarget(nodes, sourceId, point, nodeHeight = 300) {
  return nodes.findLast(node => {
    if (node.id === sourceId) return false
    const body = point.x >= node.x && point.x <= node.x + node.width && point.y >= node.y && point.y <= node.y + nodeHeight
    // Match the visible 24px input port, including its part outside the node.
    const inputPort = point.x >= node.x - 13 && point.x <= node.x + 11 && point.y >= node.y + 138 && point.y <= node.y + 162
    return body || inputPort
  })
}
