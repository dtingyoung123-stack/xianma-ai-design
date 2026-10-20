export function connectedImageReferences(document, nodeId) {
  const sources = new Set(document.edges.filter(edge => edge.target === nodeId).map(edge => edge.source))
  return document.nodes.filter(node => sources.has(node.id) && node.type === "image" && node.result)
}

export function appendCharacterVersion(node, version) {
  const versions = node.versions?.length ? node.versions : node.result ? [{ id: "original", result: node.result, label: "原结果" }] : []
  return { ...node, result: version.result, versions: [...versions, version], activeVersion: version.id, generated: true }
}

// Shared by every entry point, including retry and the generation handler.
export function characterGenerationBlock(document, node) {
  if (node.mode !== "character-four-views") return ""
  const refs = connectedImageReferences(document, node.id)
  if (!refs.length) return "请先关联角色参考图"
  if (refs.length > 1 && !refs.some(ref => ref.id === node.referenceId)) return "请选择一张关联角色参考图"
  return ""
}

// Keep ordinary creation settings intact while the preset owns its output layout.
export function imageCreationSettings(node) {
  const preset = node.mode === "character-four-views"
  return { model: node.model || "GPT Image 2", resolution: preset ? "1K" : node.resolution || "1K", ratio: preset ? "3:2" : node.ratio || "1:1", count: preset ? 1 : node.count || 1, locked: preset }
}

export function changeImageCreationSetting(node, key, value) {
  if (!["model", "resolution", "ratio", "count"].includes(key)) return node
  if (imageCreationSettings(node).locked && key !== "model") return node
  return { ...node, [key]: value }
}

export function toggleCanvasReference(document, targetId, sourceId, edgeId) {
  const source = document.nodes.find(node => node.id === sourceId)
  if (sourceId === targetId || !document.nodes.some(node => node.id === targetId) || !source || !["image", "text"].includes(source.type) || (source.type === "image" && !source.result)) return document
  const exists = document.edges.some(edge => edge.source === sourceId && edge.target === targetId)
  return { ...document, edges: exists ? document.edges.filter(edge => edge.source !== sourceId || edge.target !== targetId) : [...document.edges, { id: edgeId, source: sourceId, target: targetId }] }
}

export function characterPromptSnapshot(basePrompt, userPrompt = "") {
  const supplement = userPrompt.trim()
  return { basePrompt, userPrompt, prompt: supplement ? `${basePrompt}\n\n【用户补充要求】\n${supplement}` : basePrompt }
}
