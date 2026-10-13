// Geometry adapted from BeefTV v1.5.5 agent-panel-layout.ts (MIT).
// See BEEFTV-LICENSE.txt. No BeefTV runtime or dependencies are imported.
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function constrainPanel(layout, viewport) {
  const margin = 12
  // Reserve the existing parent frame's project-return/header area.
  const topMargin = Math.min(72, Math.max(margin, viewport.height / 4))
  const width = clamp(layout.width, Math.min(340, viewport.width - margin * 2), Math.max(1, viewport.width - margin * 2))
  const maxHeight = Math.max(1, viewport.height - topMargin - margin)
  const height = clamp(layout.height, Math.min(280, maxHeight), maxHeight)
  return { width, height, left: clamp(layout.left, margin, Math.max(margin, viewport.width - width - margin)), top: clamp(layout.top, topMargin, Math.max(topMargin, viewport.height - height - margin)) }
}

export function zoomAtPoint(pan, oldZoom, nextZoom, point) {
  return { x: point.x - (point.x - pan.x) * nextZoom / oldZoom, y: point.y - (point.y - pan.y) * nextZoom / oldZoom }
}

export function intersects(a, b) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
}

export function copySelection(nodes, ids, makeId, offset = 40) {
  const sources = nodes.filter(node => ids.has(node.id))
  const mapping = new Map(sources.map(node => [node.id, makeId()]))
  return sources.map(source => {
    const node = structuredClone(source)
    node.id = mapping.get(source.id)
    node.name = `${source.name} 副本`
    node.x += offset
    node.y += offset
    node.parents = (source.parents?.length ? source.parents : source.parent ? [source.parent] : []).filter(id => mapping.has(id)).map(id => mapping.get(id))
    node.parent = node.parents[0] || null
    return node
  })
}
