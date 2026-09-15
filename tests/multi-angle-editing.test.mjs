import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  buildMultiAnglePrompt,
  createDefaultMultiAngleValues,
  normalizeMultiAngleValue,
  resolveMultiAngleDefinition,
} from "../src/data/demo/multi-angle.js"

const pageSource = await readFile(new URL("../src/app/ai-hub/MultiAnglePage.jsx", import.meta.url), "utf8")

test("斜方向默认角度均为 45 度且每次返回独立状态", () => {
  const first = createDefaultMultiAngleValues()
  const second = createDefaultMultiAngleValues()
  assert.deepEqual(first, {
    "front-left": 45,
    "front-right": 45,
    "back-left": 45,
    "back-right": 45,
  })
  first["front-left"] = 20
  assert.equal(second["front-left"], 45)
})

test("角度输入限制到 0 至 90 并取最近的 5 倍数", () => {
  assert.equal(normalizeMultiAngleValue(-12), 0)
  assert.equal(normalizeMultiAngleValue(0), 0)
  assert.equal(normalizeMultiAngleValue(22), 20)
  assert.equal(normalizeMultiAngleValue(23), 25)
  assert.equal(normalizeMultiAngleValue(89), 90)
  assert.equal(normalizeMultiAngleValue(120), 90)
  assert.equal(normalizeMultiAngleValue(""), 45)
})

test("四个斜方向生成正确标签、实际方位角和英文提示词", () => {
  const values = {
    "front-left": 20,
    "front-right": 50,
    "back-left": 30,
    "back-right": 70,
  }
  assert.deepEqual(
    ["front-left", "front-right", "back-left", "back-right"].map((id) => {
      const angle = resolveMultiAngleDefinition(id, values)
      return [angle.label, angle.actualAzimuth, angle.anglePrompt]
    }),
    [
      ["左前 20°", 340, "20 degrees left-front view"],
      ["右前 50°", 50, "50 degrees right-front view"],
      ["左后 30°", 210, "30 degrees left-back view"],
      ["右后 70°", 110, "70 degrees right-back view"],
    ],
  )

  assert.deepEqual(
    [0, 90].map((value) => {
      const angle = resolveMultiAngleDefinition("front-left", { "front-left": value })
      return [angle.label, angle.actualAzimuth, angle.anglePrompt]
    }),
    [
      ["左前 0°", 0, "0 degrees left-front view"],
      ["左前 90°", 270, "90 degrees left-front view"],
    ],
  )
})

test("固定方向保持不可编辑并映射标准提示词", () => {
  assert.deepEqual(
    ["front", "right", "back", "left"].map((id) => {
      const angle = resolveMultiAngleDefinition(id)
      return [angle.label, angle.actualAzimuth, angle.anglePrompt, Boolean(angle.editable)]
    }),
    [
      ["正面", 0, "front view", false],
      ["右侧", 90, "right side view", false],
      ["背面", 180, "back view", false],
      ["左侧", 270, "left side view", false],
    ],
  )
})

test("完整提示词按基础描述、一致性约束和补充提示词拼接", () => {
  const prompt = buildMultiAnglePrompt("20 degrees left-front view", "白色背景")
  assert.match(prompt, /^product photography, 20 degrees left-front view, eye-level camera angle/)
  assert.match(prompt, /keep product identity, structure proportion, color, material, text, logo and packaging details consistent with the reference image/)
  assert.match(prompt, /白色背景$/)
})

test("页面保留选择入口并提供独立编辑、恢复默认和误差提示", () => {
  assert.match(pageSource, /aria-pressed=\{selected\}/)
  assert.match(pageSource, /aria-label=\{`编辑\$\{angle\.direction\}角度/)
  assert.match(pageSource, /恢复默认角度/)
  assert.match(pageSource, /至少选择 2 个角度。/)
  assert.match(pageSource, /实际效果可能存在 ±15° 偏差/)
  assert.match(pageSource, /type="range"/)
  assert.match(pageSource, /方位锁定/)
})
