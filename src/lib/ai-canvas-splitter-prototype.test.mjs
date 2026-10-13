import assert from "node:assert/strict"
import test from "node:test"
import {
  buildDownloadManifest,
  buildSplitTasks,
  collectSplitterInputs,
  composeTaskPrompt,
  defaultSplitterConfig,
  groupTasksByDirection,
  resolveDirectionCount,
  validateSplitPlan,
} from "./ai-canvas-splitter-prototype.mjs"

test("smart direction count is the first and default strategy", () => {
  assert.equal(defaultSplitterConfig.directions, "smart")
  assert.equal(resolveDirectionCount(defaultSplitterConfig, "制作电商主图、卖点图和详情图"), 3)
  assert.equal(resolveDirectionCount(defaultSplitterConfig, "制作一组商品视觉"), 3)
  assert.equal(resolveDirectionCount({ ...defaultSplitterConfig, directions: 5 }, "制作商品图"), 5)
})

test("3x2 planning creates three direction prompts with two candidates each", () => {
  const tasks = buildSplitTasks({
    config: { ...defaultSplitterConfig, directions: 3, perDirection: 2 },
    userRequest: "加湿器主图、卖点图和详情图",
    batchId: "batch-test",
  })
  assert.equal(tasks.length, 3)
  assert.deepEqual(tasks.map((task) => task.directionIndex), [0, 1, 2])
  assert.deepEqual(tasks.map((task) => task.candidates.length), [2, 2, 2])
  assert.equal(tasks.flatMap((task) => task.candidates).length, 6)
  assert.equal(groupTasksByDirection(tasks).length, 3)
  assert.equal(new Set(tasks.map((task) => task.prompt)).size, 3)
  assert.equal(Object.hasOwn(tasks[0].candidates[0], "prompt"), false)
})

test("splitter request and linked reference text remain separate", () => {
  const sources = [
    { data: { textRole: "request", text: "生成三张商品图" } },
    { data: { textRole: "reference", text: "商品颜色为白色" } },
  ]
  const explicit = collectSplitterInputs({ config: { ...defaultSplitterConfig, brief: "制作活动图" }, textSources: sources })
  assert.equal(explicit.userRequest, "制作活动图")
  assert.equal(explicit.referenceText, "生成三张商品图\n商品颜色为白色")

  const fallback = collectSplitterInputs({ config: defaultSplitterConfig, textSources: sources })
  assert.equal(fallback.userRequest, "生成三张商品图")
  assert.equal(fallback.referenceText, "商品颜色为白色")
})

test("copy toggle recomposes only the current task prompt", () => {
  const [task] = buildSplitTasks({ config: defaultSplitterConfig, userRequest: "制作商品主图" })
  assert.match(task.prompt, new RegExp(task.copyText))
  const withoutCopy = { ...task, copyInImage: false }
  const prompt = composeTaskPrompt(withoutCopy)
  assert.doesNotMatch(prompt, new RegExp(task.copyText))
  assert.match(prompt, /不生成文字/)
})

test("image mentions map to stable zero-based indexes", () => {
  const images = [
    { id: "product", data: { title: "商品图", src: "/product.png" } },
    { id: "scene", data: { title: "场景图", src: "/scene.png" } },
  ]
  const inputs = collectSplitterInputs({ config: { ...defaultSplitterConfig, brief: "把 @商品图 放入 @场景图" }, imageSources: images })
  const [task] = buildSplitTasks({ config: defaultSplitterConfig, ...inputs })
  assert.deepEqual(task.refImages, [0, 1])
  assert.deepEqual(task.referenceImages.map((image) => image.mention), ["商品图", "场景图"])
  assert.throws(() => collectSplitterInputs({ config: { ...defaultSplitterConfig, brief: "参考 @不存在" }, imageSources: images }), /无法解析/)
})

test("invalid LLM structures stay in planning stage", () => {
  assert.throws(() => validateSplitPlan("not-json", { directionCount: 1, imagesPerDirection: 1, imageCount: 0 }), /无法解析/)
  assert.throws(() => validateSplitPlan({ directions: [] }, { directionCount: 1, imagesPerDirection: 1, imageCount: 0 }), /1 个/)
  assert.throws(() => validateSplitPlan({ directions: [{}] }, { directionCount: 1, imagesPerDirection: 1, imageCount: 0 }), /1 条提示词/)
  assert.throws(() => validateSplitPlan({ directions: [{ task: { prompt: "", refImages: [], candidateCount: 1, candidates: [{}] } }] }, { directionCount: 1, imagesPerDirection: 1, imageCount: 0 }), /提示词为空/)
  assert.throws(() => validateSplitPlan({ directions: [{ task: { prompt: "ok", refImages: [1], candidateCount: 1, candidates: [{}] } }] }, { directionCount: 1, imagesPerDirection: 1, imageCount: 1 }), /索引越界/)
  assert.throws(() => validateSplitPlan({ directions: [{ task: { prompt: "ok", refImages: [], candidateCount: 1, candidates: [{}] } }] }, { directionCount: 1, imagesPerDirection: 2, imageCount: 0 }), /2 张候选图/)
})

test("download manifest separates successful and failed tasks", () => {
  const tasks = buildSplitTasks({ config: { ...defaultSplitterConfig, directions: 3, perDirection: 2 }, userRequest: "制作商品图" })
    .map((task, taskIndex) => ({
      ...task,
      candidates: task.candidates.map((candidate) => ({
        ...candidate,
        status: taskIndex === 2 && candidate.slotIndex === 1 ? "failed" : "success",
      })),
    }))
  const manifest = buildDownloadManifest(tasks)
  assert.equal(manifest.successful.length, 5)
  assert.equal(manifest.failed.length, 1)
  assert.equal(manifest.failed[0].status, "failed")
  assert.equal(manifest.failed[0].slotIndex, 1)
})
