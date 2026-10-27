export function backgroundColorPrompt(mode, color) {
  const target = `${color.name}（${color.hex}）`
  if (mode === "detail-refresh") return `将整组详情图的背景底色统一更改为${target}，商品按原有保留或替换要求处理，不新增未提供的商品事实。`
  if (mode === "subject-replace") return `按原有要求完成主体替换，同时将背景底色更改为${target}。`
  if (mode === "batch-edit") return `将每张图片的背景底色统一更改为${target}，保留商品、文字、Logo、图标及排版不变。`
  return `将背景底色更改为${target}，保持商品、文字、Logo、图标及排版不变。`
}

export function insertBackgroundColorPrompt(value, previous, next) {
  const text = String(value || "")
  if (previous && text.includes(previous)) return text.replace(previous, next)
  return text ? `${text}\n${next}` : next
}
