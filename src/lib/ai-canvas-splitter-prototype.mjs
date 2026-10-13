const smartDirections = [
  { name: "电商主图", focus: "突出商品主体和清晰轮廓", keywords: ["主图", "首图", "白底"] },
  { name: "核心卖点", focus: "聚焦一项有输入依据的产品特点", keywords: ["卖点", "优势", "特点", "功能"] },
  { name: "详情展示", focus: "承接详情页信息并预留文字区域", keywords: ["详情", "详情页", "长图"] },
  { name: "场景展示", focus: "呈现自然使用场景", keywords: ["场景", "家居", "户外", "办公"] },
  { name: "细节特写", focus: "展示材质与可见工艺细节", keywords: ["细节", "材质", "工艺", "特写"] },
  { name: "使用体验", focus: "呈现人与商品的使用关系", keywords: ["体验", "使用", "买家秀", "人物"] },
  { name: "组合陈列", focus: "展示完整商品与配件关系", keywords: ["组合", "套装", "配件", "陈列"] },
  { name: "氛围延展", focus: "拓展与商品匹配的视觉氛围", keywords: ["氛围", "情绪", "质感", "创意"] },
]

const copyVariants = ["一眼看见重点", "让细节更清楚", "融入真实使用场景", "从近处看见质感"]

export const defaultSplitterConfig = {
  brief: "",
  negative: "",
  directions: "smart",
  perDirection: 2,
  ratio: "1:1",
  resolution: "2K",
  model: "GPT Image 2",
}

export function collectSplitterInputs({ config, textSources = [], imageSources = [] }) {
  const directRequest = config.brief?.trim() || ""
  const requestTexts = textSources
    .filter((source) => source.data?.textRole === "request")
    .map((source) => source.data?.text?.trim())
    .filter(Boolean)
  const otherTexts = textSources
    .filter((source) => source.data?.textRole !== "request")
    .map((source) => source.data?.text?.trim())
    .filter(Boolean)
  const userRequest = directRequest || requestTexts.join("\n")
  if (!userRequest) throw new Error("请填写拆分需求，或连接标记为需求的文本节点")

  const referenceText = directRequest ? [...requestTexts, ...otherTexts].join("\n") : otherTexts.join("\n")
  const referenceImages = imageSources.map((source, index) => ({
    index,
    id: source.data?.assetId || source.id,
    mention: source.data?.title || source.title || `图片${index + 1}`,
    role: source.data?.imageRole || "unknown",
    description: source.data?.title || source.title || "",
    src: source.data?.src || source.src || "",
  }))

  resolveMentionIndexes(`${userRequest}\n${referenceText}`, referenceImages)
  return { userRequest, referenceText, referenceImages }
}

export function buildSplitTasks({ config, userRequest, referenceText = "", referenceImages = [], batchId = "demo" }) {
  const request = userRequest?.trim()
  if (!request) throw new Error("用户需求不能为空")
  const directionCount = resolveDirectionCount(config, `${request}\n${referenceText}`)
  if (![1, 2, 4].includes(config.perDirection)) throw new Error("每个方向请选择 1、2 或 4 张")

  const normalizedRequest = request.replace(/[。.!！]+$/, "")
  const selectedDirections = selectSmartDirections(`${request}\n${referenceText}`, directionCount)
  const mentionedIndexes = resolveMentionIndexes(`${request}\n${referenceText}`, referenceImages)
  const refIndexes = mentionedIndexes.length ? mentionedIndexes : referenceImages.map((image) => image.index)

  const directions = Array.from({ length: directionCount }, (_, directionIndex) => {
    const smartDirection = selectedDirections[directionIndex] || smartDirections[directionIndex]
    const directionName = smartDirection.name
    const directionBrief = `${smartDirection.name}：${smartDirection.focus}`
    const visualPrompt = composeVisualPrompt({
      request: normalizedRequest,
      referenceText,
      directionBrief,
      shotBrief: "围绕当前方向生成候选图，保持核心要求一致，并允许构图和细节产生自然差异",
      referenceImages,
      refIndexes,
    })
    const task = {
      id: `${batchId}-${directionIndex + 1}`,
      batchId,
      directionIndex,
      title: directionName,
      direction: directionName,
      copyText: copyVariants[directionIndex % copyVariants.length],
      copyInImage: true,
      visualPrompt,
      prompt: "",
      negative: config.negative?.trim() || "",
      taskNegative: directionName.includes("人物") || directionName.includes("体验") ? "手指异常、肢体错位、面部畸变" : "",
      refImages: [...refIndexes],
      referenceImages: refIndexes.map((index) => referenceImages[index]).filter(Boolean),
      ratio: config.ratio,
      resolution: config.resolution,
      model: config.model,
      candidateCount: config.perDirection,
      candidates: Array.from({ length: config.perDirection }, (_, slotIndex) => ({
        id: `${batchId}-${directionIndex + 1}-candidate-${slotIndex + 1}`,
        slotIndex,
        status: "planned",
        attempts: 0,
        history: [],
        versions: [],
      })),
    }
    const completedTask = { ...task, prompt: composeTaskPrompt(task) }
    return { directionIndex, name: directionName, task: completedTask }
  })

  validateSplitPlan({ schemaVersion: "2.0", directions }, {
    directionCount,
    imagesPerDirection: config.perDirection,
    imageCount: referenceImages.length,
  })
  return directions.map((direction) => direction.task)
}

export function resolveDirectionCount(config, requestText = "") {
  if (config.directions === "smart") {
    const matchedCount = smartDirections.filter((item) => item.keywords.some((keyword) => requestText.includes(keyword))).length
    return matchedCount || 3
  }
  if (!Number.isInteger(config.directions) || config.directions < 1 || config.directions > 8) {
    throw new Error("拆分方向须为智能或 1–8 个")
  }
  return config.directions
}

export function composeTaskPrompt(task) {
  const copyInstruction = task.copyInImage && task.copyText?.trim()
    ? `画面中准确呈现文案“${task.copyText.trim()}”，保留清晰文字区并确保文字可读。`
    : "画面不生成文字，保留适合后期排版的留白。"
  return `${task.visualPrompt}。${copyInstruction}`.replace(/。。+/g, "。").trim()
}

export function validateSplitPlan(plan, expected) {
  let parsed = plan
  if (typeof plan === "string") {
    try {
      parsed = JSON.parse(plan)
    } catch {
      throw new Error("拆分方案无法解析，请重试")
    }
  }
  if (!parsed || !Array.isArray(parsed.directions)) throw new Error("拆分方案缺少方向数据")
  if (parsed.directions.length !== expected.directionCount) throw new Error(`拆分方向必须为 ${expected.directionCount} 个`)
  parsed.directions.forEach((direction, directionIndex) => {
    const task = direction.task
    if (!task || typeof task !== "object") throw new Error(`方向 ${directionIndex + 1} 必须包含 1 条提示词`)
    if (!task.prompt?.trim()) throw new Error(`方向 ${directionIndex + 1} 的提示词为空`)
    if (task.prompt.length > 1200) throw new Error(`方向 ${directionIndex + 1} 的提示词超过 1200 字符`)
    if (!Array.isArray(task.refImages)) throw new Error(`方向 ${directionIndex + 1} 的图片引用无效`)
    if (task.refImages.some((index) => !Number.isInteger(index) || index < 0 || index >= expected.imageCount)) {
      throw new Error(`方向 ${directionIndex + 1} 的图片索引越界`)
    }
    if (task.candidateCount !== expected.imagesPerDirection || task.candidates?.length !== expected.imagesPerDirection) {
      throw new Error(`方向 ${directionIndex + 1} 必须生成 ${expected.imagesPerDirection} 张候选图`)
    }
  })
  return parsed
}

export function groupTasksByDirection(tasks) {
  return [...tasks]
    .sort((a, b) => a.directionIndex - b.directionIndex)
    .map((task) => ({ directionIndex: task.directionIndex, task }))
}

export function buildDownloadManifest(tasks = []) {
  const outputs = tasks.flatMap((task) => Array.isArray(task.candidates)
    ? task.candidates.map((candidate) => ({
      ...candidate,
      taskId: task.id,
      direction: task.direction,
      directionIndex: task.directionIndex,
      title: `${task.title} 候选图 ${candidate.slotIndex + 1}`,
    }))
    : [task])
  const summarize = (output) => ({
    id: output.id,
    taskId: output.taskId,
    direction: output.direction,
    directionIndex: output.directionIndex,
    slotIndex: output.slotIndex,
    title: output.title,
  })
  return {
    successful: outputs.filter((output) => output.status === "success").map(summarize),
    failed: outputs.filter((output) => output.status === "failed").map((output) => ({ ...summarize(output), status: output.status })),
  }
}

export function mergeNegativePrompts(globalNegative, taskNegative) {
  return [...new Set([globalNegative, taskNegative].flatMap((value) => (value || "").split(/[，,]/)).map((value) => value.trim()).filter(Boolean))].join("，")
}

function composeVisualPrompt({ request, referenceText, directionBrief, shotBrief, referenceImages, refIndexes }) {
  const references = refIndexes.map((index) => referenceImages[index]).filter(Boolean)
  const sourceText = referenceText ? `补充资料：${referenceText}。` : ""
  const referenceTextPart = references.length
    ? `按索引参考 ${references.map((image) => `@${image.mention}[${image.index}]`).join("、")}，保持有来源的主体事实。`
    : "无参考图，按文字需求生成概念画面，不补造品牌、规格、功效或其他商品事实。"
  return `${request}。${sourceText}${directionBrief}。${shotBrief}。${referenceTextPart}`.replace(/。。+/g, "。").trim()
}

function resolveMentionIndexes(text, referenceImages) {
  const mentions = [...String(text || "").matchAll(/@([^\s，,。；;]+)/g)].map((match) => match[1])
  if (!mentions.length) return []
  const indexes = mentions.map((mention) => {
    const matched = referenceImages.find((image) => image.mention === mention || image.mention.includes(mention) || mention.includes(image.mention))
    if (!matched) throw new Error(`无法解析图片引用 @${mention}`)
    return matched.index
  })
  return [...new Set(indexes)].sort((a, b) => a - b)
}

function selectSmartDirections(request, count) {
  const matched = smartDirections.filter((item) => item.keywords.some((keyword) => request.includes(keyword)))
  const remaining = smartDirections.filter((item) => !matched.includes(item))
  return [...matched, ...remaining].slice(0, count)
}
