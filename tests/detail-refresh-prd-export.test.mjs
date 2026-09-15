import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const page = await readFile(new URL("../src/app/ai-hub/DetailRefreshPage.jsx", import.meta.url), "utf8")
const route = await readFile(new URL("../src/app/api/detail-refresh-prd/route.js", import.meta.url), "utf8")
const prd = await readFile(new URL("../docs/AI商详焕新MVP1.0需求PRD_260911.md", import.meta.url), "utf8")

test("AI 商详焕新标题区提供开发用 PRD 导出入口", () => {
  assert.match(page, /href="\/api\/detail-refresh-prd"/)
  assert.match(page, /download/)
  assert.match(page, /导出 PRD/)
})

test("AI 商详焕新 PRD 导出接口读取正式 V1.2 文件并返回 Markdown", () => {
  assert.match(route, /AI商详焕新MVP1\.0需求PRD_260911\.md/)
  assert.match(route, /text\/markdown; charset=utf-8/)
  assert.match(route, /status: 404/)
})

test("V1.2 PRD 覆盖视频预处理与素材图片自动命名规则", () => {
  assert.match(prd, /AI 视频流和无限画布调用海螺 H3、Seedance 2、Seedance 2\.5/)
  assert.match(prd, /短边达到 512px/)
  assert.match(prd, /双线性插值/)
  assert.match(prd, /原图不覆盖/)
  assert.match(prd, /preprocess_failed_fallback/)
  assert.match(prd, /素材库图片自动识别命名/)
  assert.match(prd, /MN-CHG-01/)
  assert.match(prd, /MN-R-03 结构化命名/)
  assert.match(prd, /MN-AC-13/)
  assert.match(prd, /naming_source=AI_AUTO/)
  assert.match(prd, /同时加入个人素材/)
  assert.match(prd, /修订记录/)
})
