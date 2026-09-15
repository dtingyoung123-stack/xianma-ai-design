import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  buildMaterialNamingSuggestion,
  buildMaterialSuggestionTags,
  getDemoMaterialRecognitionSlots,
  materialNamingSources,
  materialRecognitionStatuses,
  prepareDemoAutoNamedMaterialDrafts,
  recognizeDemoMaterialImage,
  resolveMaterialSuggestionCategory,
} from "../src/data/demo/materials.js"

const pageSource = await readFile(new URL("../src/app/materials/MaterialsClient.jsx", import.meta.url), "utf8")
const pickerSource = await readFile(new URL("../src/components/workbench/AssetPickerModal.jsx", import.meta.url), "utf8")

test("命名按产品、人物、场景、姿态和两位序号组合", () => {
  const suggestion = buildMaterialNamingSuggestion({
    product: "护腰带",
    person: "女模",
    scene: "客厅",
    pose: "站立",
    category: "护具类",
  })
  assert.equal(suggestion.title, "护腰带女模客厅站立01")
  assert.equal(suggestion.category, "护具类")
  assert.deepEqual(suggestion.tags, ["女模", "客厅", "站立"])
})

test("无效槽位不进入名称和标签，标签去重", () => {
  const slots = { product: "地垫", person: "无人物", scene: "玄关", pose: "玄关", category: "地垫" }
  const suggestion = buildMaterialNamingSuggestion(slots)
  assert.equal(suggestion.title, "地垫玄关玄关01")
  assert.deepEqual(buildMaterialSuggestionTags(slots), ["玄关"])
  assert.equal(suggestion.title.includes("无人物"), false)
})

test("超过二十字依次移除姿态、人物和场景，但标签保留识别信息", () => {
  const suggestion = buildMaterialNamingSuggestion({
    product: "加厚可调节运动防护支撑护腰带",
    person: "专业运动男模",
    scene: "大型室内健身房",
    pose: "侧身拉伸训练",
    category: "护具类",
  })
  assert.equal(Array.from(suggestion.title).length <= 20, true)
  assert.equal(suggestion.title.includes("侧身拉伸训练"), false)
  assert.deepEqual(suggestion.tags, ["专业运动男模", "大型室内健身房", "侧身拉伸训练"])
  assert.match(suggestion.title, /01$/)
})

test("地垫映射到现有地毯类，未分类不成为建议值", () => {
  assert.equal(resolveMaterialSuggestionCategory({ product: "地垫", category: "地垫" }), "地毯类")
  assert.equal(resolveMaterialSuggestionCategory({ product: "未知商品", category: "未分类" }), "通用")
})

test("批内和素材库已有名称共同分配下一个可用序号", () => {
  const slots = { product: "护膝", person: "男模", scene: "户外", pose: "跑步", category: "护具类" }
  const first = buildMaterialNamingSuggestion(slots, [])
  const second = buildMaterialNamingSuggestion(slots, [first.title])
  const hundredth = buildMaterialNamingSuggestion(slots, ["护膝男模户外跑步99"])
  assert.equal(first.title, "护膝男模户外跑步01")
  assert.equal(second.title, "护膝男模户外跑步02")
  assert.equal(hundredth.title, "护膝男模户外跑步100")
})

test("缺少产品主体或演示失败文件时返回未识别", async () => {
  assert.equal(buildMaterialNamingSuggestion({ product: "其他", scene: "客厅" }), null)
  assert.equal(getDemoMaterialRecognitionSlots("无法识别.png"), null)
  assert.equal(await recognizeDemoMaterialImage({ name: "fail.png" }, { delay: 0 }), null)
})

test("页面草稿覆盖识别、采纳、人工保护、混合上传和迟到结果保护", () => {
  assert.deepEqual(materialRecognitionStatuses, {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    READY: "READY",
    FAILED: "FAILED",
  })
  assert.deepEqual(materialNamingSources, {
    ORIGINAL: "ORIGINAL",
    AI_SUGGESTION: "AI_SUGGESTION",
    AI_AUTO: "AI_AUTO",
    MANUAL: "MANUAL",
  })
  assert.match(pageSource, /recognizeImages/)
  assert.match(pageSource, /adoptSuggestion/)
  assert.match(pageSource, /adoptAllSuggestions/)
  assert.match(pageSource, /!draft\.manuallyEdited/)
  assert.match(pageSource, /draft\.type !== "image"/)
  assert.match(pageSource, /discardedDraftIdsRef/)
  assert.match(pageSource, /recognitionRunRef/)
  assert.match(pageSource, /图片识别中/)
})

test("图片只保留单张最终字段，音视频统一设置不覆盖图片", () => {
  assert.doesNotMatch(pageSource, /批量默认类目|批量默认标签/)
  assert.match(pageSource, /视频\/音频统一类目/)
  assert.match(pageSource, /视频\/音频统一标签/)
  assert.match(pageSource, /draft\.type !== "image"/)
  assert.match(pageSource, /type === "image" \? "通用" : category/)
})

test("工作台勾选快捷入库时生成自动命名元数据且保留任务图片字段", () => {
  const drafts = prepareDemoAutoNamedMaterialDrafts([
    { name: "护膝.png", filename: "护膝.png", title: "护膝", category: "未分类", tags: [] },
    { name: "fail.png", filename: "fail.png", title: "fail", category: "未分类", tags: [] },
  ], ["护膝男模户外跑步01"])

  assert.equal(drafts[0].title, "护膝")
  assert.equal(drafts[0].materialMetadata.title, "护膝男模户外跑步02")
  assert.equal(drafts[0].materialMetadata.category, "护具类")
  assert.deepEqual(drafts[0].materialMetadata.tags, ["男模", "户外", "跑步"])
  assert.equal(drafts[0].materialMetadata.namingSource, materialNamingSources.AI_AUTO)
  assert.equal(drafts[1].materialMetadata.title, "fail")
  assert.equal(drafts[1].materialMetadata.category, "通用")
  assert.deepEqual(drafts[1].materialMetadata.tags, [])
  assert.equal(drafts[1].materialMetadata.namingSource, materialNamingSources.ORIGINAL)
  assert.equal(drafts[1].materialMetadata.recognitionStatus, materialRecognitionStatuses.FAILED)
})

test("共享素材选择器仅在本地图片勾选入库时准备自动命名", () => {
  assert.match(pickerSource, /source === "local" && saveToMine/)
  assert.match(pickerSource, /prepareDemoAutoNamedMaterialDrafts/)
  assert.match(pickerSource, /确认选择后自动识别名称、类目和标签，不影响当前任务/)
})

test("入库按单文件最终字段写入并保留原文件名", () => {
  assert.match(pageSource, /draft\.currentTitle\?\.trim\(\)/)
  assert.match(pageSource, /filename: file\.name/)
  assert.match(pageSource, /category: draft\.currentCategory/)
  assert.match(pageSource, /tags: draft\.currentTags/)
  assert.match(pageSource, /namingSource: draft\.namingSource/)
})
