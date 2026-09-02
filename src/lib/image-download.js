const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"])

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
}

export function stripFileExtension(value) {
  let normalized = String(value || "")
  while (/\.(?:jpe?g|png|webp|gif|avif|bmp)$/i.test(normalized)) {
    normalized = normalized.replace(/\.(?:jpe?g|png|webp|gif|avif|bmp)$/i, "")
  }
  return normalized
}

export function sanitizeImageName(value) {
  return stripFileExtension(value)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .trim()
}

export function getImageExtension({ mime, src, extension } = {}) {
  const requested = normalizeExtension(extension)
  if (requested) return requested

  const normalizedMime = String(mime || "").split(";")[0].trim().toLowerCase()
  if (MIME_EXTENSIONS[normalizedMime]) return MIME_EXTENSIONS[normalizedMime]

  const dataMime = String(src || "").match(/^data:(image\/[a-zA-Z0-9.+-]+)[;,]/)?.[1]?.toLowerCase()
  if (dataMime && MIME_EXTENSIONS[dataMime]) return MIME_EXTENSIONS[dataMime]

  const urlExtension = String(src || "").split(/[?#]/)[0].match(/\.([a-zA-Z0-9]+)$/)?.[1]
  return normalizeExtension(urlExtension) || "png"
}

export function buildImageFilename({ name, src, mime, extension, featureName = "图片", index = 0 } = {}) {
  const cleanName = sanitizeImageName(name)
  const fallbackFeature = sanitizeImageName(featureName) || "图片"
  const baseName = cleanName || `${fallbackFeature}-${Number(index) + 1}`
  return `${baseName}.${getImageExtension({ mime, src, extension })}`
}

export function uniquifyImageFilenames(items, options = {}) {
  const filenames = items.map((item, index) => buildImageFilename({ ...options, ...item, index: item.index ?? index }))
  const counts = filenames.reduce((map, filename) => {
    const key = filename.toLocaleLowerCase()
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())
  const positions = new Map()

  return filenames.map((filename) => {
    const key = filename.toLocaleLowerCase()
    if ((counts.get(key) || 0) < 2) return filename
    const position = (positions.get(key) || 0) + 1
    positions.set(key, position)
    const extension = filename.match(/\.([^.]+)$/)?.[1] || "png"
    const baseName = filename.slice(0, -(extension.length + 1))
    return `${baseName}-${String(position).padStart(2, "0")}.${extension}`
  })
}

export async function downloadImage({ src, name, mime, featureName, index = 0, format } = {}) {
  if (!src) throw new Error("图片地址不可用")
  const requestedExtension = normalizeExtension(format)

  if (requestedExtension === "png" || requestedExtension === "jpg") {
    const blob = await convertImageFormat(src, requestedExtension)
    const filename = buildImageFilename({ name, mime: blob.type, extension: requestedExtension, featureName, index })
    downloadBlob(blob, filename)
    return filename
  }

  const response = await fetch(src)
  if (!response.ok) throw new Error("图片下载失败")
  const blob = await response.blob()
  const filename = buildImageFilename({ name, src, mime: blob.type || mime, featureName, index })
  downloadBlob(blob, filename)
  return filename
}

export async function downloadImageZip({ items, zipName = "图片结果", featureName = "图片" } = {}) {
  const availableItems = (items || []).filter((item) => item?.src)
  const fetched = await Promise.all(availableItems.map(async (item, index) => {
    const response = await fetch(item.src)
    if (!response.ok) throw new Error(`图片下载失败：${item.name || index + 1}`)
    const blob = await response.blob()
    return {
      ...item,
      index: item.index ?? index,
      mime: blob.type || item.mime,
      buffer: await blob.arrayBuffer(),
    }
  }))

  if (!fetched.length) throw new Error("当前没有可下载图片")
  const filenames = uniquifyImageFilenames(fetched, { featureName })
  const files = fetched.map((item, index) => ({ name: filenames[index], buffer: item.buffer }))
  const blob = createStoredZip(files)
  const filename = `${sanitizeImageName(zipName) || "图片结果"}.zip`
  downloadBlob(blob, filename)
  return { filename, files: filenames }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function createStoredZip(files) {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []
  let offset = 0

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name)
    const data = new Uint8Array(file.buffer)
    const crc = crc32(data)
    const localHeader = zipHeader(
      [0x04034b50, 20, 0x0800, 0, 0, 0, crc, data.length, data.length, nameBytes.length, 0],
      [4, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2],
    )
    localParts.push(localHeader, nameBytes, data)

    const centralHeader = zipHeader(
      [0x02014b50, 20, 20, 0x0800, 0, 0, 0, crc, data.length, data.length, nameBytes.length, 0, 0, 0, 0, 0, offset],
      [4, 2, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2, 2, 2, 2, 4, 4],
    )
    centralParts.push(centralHeader, nameBytes)
    offset += localHeader.length + nameBytes.length + data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const endRecord = zipHeader(
    [0x06054b50, 0, 0, files.length, files.length, centralSize, offset, 0],
    [4, 2, 2, 2, 2, 4, 4, 2],
  )
  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" })
}

function normalizeExtension(value) {
  const normalized = String(value || "").replace(/^\./, "").toLowerCase()
  if (!IMAGE_EXTENSIONS.has(normalized)) return ""
  return normalized === "jpeg" ? "jpg" : normalized
}

async function convertImageFormat(src, extension) {
  const response = await fetch(src)
  if (!response.ok) throw new Error("图片下载失败")
  const sourceBlob = await response.blob()
  const bitmap = await createImageBitmap(sourceBlob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("浏览器不支持图片格式转换")
  if (extension === "jpg") {
    context.fillStyle = "#FFFFFF"
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  context.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const mime = extension === "jpg" ? "image/jpeg" : "image/png"
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, extension === "jpg" ? 0.92 : undefined))
  if (!blob) throw new Error("图片格式转换失败")
  return blob
}

function zipHeader(values, sizes) {
  const length = sizes.reduce((sum, size) => sum + size, 0)
  const bytes = new Uint8Array(length)
  const view = new DataView(bytes.buffer)
  let offset = 0
  values.forEach((value, index) => {
    if (sizes[index] === 2) view.setUint16(offset, value, true)
    else view.setUint32(offset, value, true)
    offset += sizes[index]
  })
  return bytes
}

function crc32(data) {
  let crc = -1
  for (let index = 0; index < data.length; index += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[index]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})
