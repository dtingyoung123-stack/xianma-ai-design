export function calculateImageHeight(ratio, widthValue) {
  if (ratio === "智能比例" || widthValue === "") return ""
  const [ratioWidth, ratioHeight] = ratio.split(":").map(Number)
  const width = Number(widthValue)
  if (!Number.isInteger(width) || width <= 0 || !ratioWidth || !ratioHeight) return ""
  return String(Math.round(width * ratioHeight / ratioWidth))
}

export function formatImageSize(ratio, size) {
  const height = calculateImageHeight(ratio, size?.width ?? "")
  return height ? `${Number(size.width)}×${height}px` : ratio
}

export function hasValidImageSize(ratio, size) {
  if (ratio === "智能比例" || size?.width === "") return true
  return Boolean(calculateImageHeight(ratio, size?.width ?? ""))
}
