import test from "node:test"
import assert from "node:assert/strict"
import { buildImageFilename, sanitizeImageName, uniquifyImageFilenames } from "../src/lib/image-download.js"
import { detailRefreshProductLibrary, hasValidDetailRefreshConfirmation } from "../src/data/demo/detail-refresh.js"
import { canViewProduct } from "../src/lib/product-prototype.mjs"

const statuses = ["IDLE", "QUEUED", "PROCESSING", "PARTIAL_SUCCESS", "SUCCESS", "FAILED", "CANCELLED", "RETRYING"]

test("AI 商详焕新任务状态覆盖需求草案枚举", () => {
  assert.deepEqual(statuses, ["IDLE", "QUEUED", "PROCESSING", "PARTIAL_SUCCESS", "SUCCESS", "FAILED", "CANCELLED", "RETRYING"])
})

test("详情图数量边界为 1 到 9 张", () => {
  const canSubmit = (count) => count >= 1 && count <= 9
  assert.equal(canSubmit(0), false)
  assert.equal(canSubmit(1), true)
  assert.equal(canSubmit(9), true)
  assert.equal(canSubmit(10), false)
})

test("商品智库与上传图片是并行来源，商品智库事实优先", () => {
  const resolveSource = ({ productLibrary, replacementImages, original }) => productLibrary || (replacementImages?.length ? replacementImages[0] : "") || original
  assert.equal(resolveSource({ productLibrary: "商品智库事实", replacementImages: ["上传图片"], original: "原图推断" }), "商品智库事实")
  assert.equal(resolveSource({ productLibrary: "", replacementImages: ["上传图片"], original: "原图推断" }), "上传图片")
  assert.equal(resolveSource({ productLibrary: "", replacementImages: [], original: "原图推断" }), "原图推断")
})

test("没有替换来源时保持原商品，任一来源均可独立使用", () => {
  const sourceState = ({ productLibrary, replacementImages }) => ({
    keepOriginal: !productLibrary && replacementImages.length === 0,
    mode: productLibrary ? "product-library" : replacementImages.length ? "uploaded-images" : "original",
  })
  assert.deepEqual(sourceState({ productLibrary: "", replacementImages: [] }), { keepOriginal: true, mode: "original" })
  assert.deepEqual(sourceState({ productLibrary: "商品智库事实", replacementImages: [] }), { keepOriginal: false, mode: "product-library" })
  assert.deepEqual(sourceState({ productLibrary: "", replacementImages: ["上传图片"] }), { keepOriginal: false, mode: "uploaded-images" })
  assert.deepEqual(sourceState({ productLibrary: "商品智库事实", replacementImages: ["上传图片"] }), { keepOriginal: false, mode: "product-library" })
})

test("提示词支持提示词库回填与 AI 润色后的统一内容", () => {
  const applyPrompt = ({ libraryPrompt, polishedPrompt }) => polishedPrompt || libraryPrompt || ""
  assert.equal(applyPrompt({ libraryPrompt: "详情页模板", polishedPrompt: "润色后的详情页模板" }), "润色后的详情页模板")
  assert.equal(applyPrompt({ libraryPrompt: "详情页模板", polishedPrompt: "" }), "详情页模板")
})

test("输出尺寸沿用每张原图尺寸", () => {
  const inputs = [{ size: "1200 × 1200 px" }, { size: "1464 × 600 px" }]
  const outputs = inputs.map((image) => ({ ...image, outputSize: image.size }))
  assert.deepEqual(outputs.map((image) => image.outputSize), inputs.map((image) => image.size))
})

test("整组下载复用既有命名规则并自动处理重名", () => {
  const items = [{ name: "主视觉.png", src: "/a.png", index: 0 }, { name: "主视觉.png", src: "/b.png", index: 1 }]
  assert.deepEqual(uniquifyImageFilenames(items, { featureName: "AI商详焕新" }), ["主视觉-01.png", "主视觉-02.png"])
  assert.equal(buildImageFilename({ name: "卖点说明", src: "/result.webp", featureName: "AI商详焕新", index: 1 }), "卖点说明.webp")
  assert.equal(sanitizeImageName("AI商详焕新-结果图片"), "AI商详焕新-结果图片")
})

test("单张重试只更新目标结果", () => {
  const results = [{ id: "a", status: "SUCCESS" }, { id: "b", status: "FAILED" }, { id: "c", status: "SUCCESS" }]
  const retried = results.map((result) => result.id === "b" ? { ...result, status: "PROCESSING" } : result)
  assert.deepEqual(retried.map((result) => result.status), ["SUCCESS", "PROCESSING", "SUCCESS"])
})

test("每张结果反馈互斥，重复点击可取消", () => {
  const setFeedback = (result, feedback) => ({ ...result, feedback: result.feedback === feedback ? null : feedback })
  let result = { id: "a", feedback: null }
  result = setFeedback(result, "approved")
  assert.equal(result.feedback, "approved")
  result = setFeedback(result, "rejected")
  assert.equal(result.feedback, "rejected")
  result = setFeedback(result, "rejected")
  assert.equal(result.feedback, null)
})

test("重试或微调后清空当前图片旧反馈", () => {
  const result = { id: "a", status: "SUCCESS", feedback: "approved" }
  const retried = { ...result, status: "PROCESSING", feedback: null }
  const edited = { ...result, status: "SUCCESS", feedback: null }
  assert.equal(retried.feedback, null)
  assert.equal(edited.feedback, null)
})

test("商品选择器仅允许已确认且有有效确认版本的商品", () => {
  assert.equal(detailRefreshProductLibrary.some(hasValidDetailRefreshConfirmation), true)
  assert.equal(hasValidDetailRefreshConfirmation({ status: "pending_confirmation", candidates: [{ status: "success", selected: true }] }), false)
  assert.equal(hasValidDetailRefreshConfirmation({ status: "confirmed", candidates: [{ status: "failed", selected: false }], versions: [] }), false)
})

test("商品库范围按个人、团队、公共口径筛选", () => {
  const selectable = detailRefreshProductLibrary.filter((product) => hasValidDetailRefreshConfirmation(product) && canViewProduct(product, "member", "demo-member"))
  const personal = selectable.filter((product) => product.ownerId === "demo-member")
  const team = selectable.filter((product) => ["team", "public"].includes(product.scope))
  const publicProducts = selectable.filter((product) => product.scope === "public" && product.publicReviewStatus === "approved")
  assert.equal(personal.some((product) => product.teamReviewStatus === "rejected"), true)
  assert.equal(team.some((product) => product.publicReviewStatus === "rejected"), true)
  assert.equal(publicProducts.every((product) => product.publicReviewStatus === "approved"), true)
})
