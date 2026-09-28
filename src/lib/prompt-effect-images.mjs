export const MAX_PROMPT_EFFECT_IMAGES = 3
export const PROMPT_EFFECT_IMAGE_MAX_BYTES = 20 * 1024 * 1024

// Validate the entire selection before reading files; rejected batches preserve the draft.
export function validatePromptEffectFiles(files, currentCount, replacing = false) {
  if (!files.length) return ""
  if ((replacing && files.length !== 1) || (!replacing && currentCount + files.length > MAX_PROMPT_EFFECT_IMAGES)) {
    return replacing ? "替换时请选择一张图片" : "每条提示词最多上传 3 张效果图"
  }
  if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type))) return "请上传 JPG 或 PNG 格式的效果图"
  if (files.some((file) => !file.size || file.size > PROMPT_EFFECT_IMAGE_MAX_BYTES)) return "每张效果图需大于 0 字节且不超过 20MB"
  return ""
}

export async function readPromptEffectFiles(files) {
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("图片读取失败，请重新选择"))
    reader.onabort = reader.onerror
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error("图片无法打开，请检查文件后重新选择"))
      image.onload = () => resolve({ id: crypto.randomUUID(), src: reader.result, name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` })
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })))
}
