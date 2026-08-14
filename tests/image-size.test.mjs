import assert from "node:assert/strict"
import test from "node:test"

import {
  calculateImageHeight,
  formatImageSize,
  hasValidImageSize,
} from "../src/lib/image-size.js"

test("按所选比例将宽度换算为整数高度", () => {
  assert.equal(calculateImageHeight("4:3", "800"), "600")
  assert.equal(calculateImageHeight("16:9", "1000"), "563")
  assert.equal(calculateImageHeight("3:4", "900"), "1200")
})

test("智能比例或空宽度不生成高度", () => {
  assert.equal(calculateImageHeight("智能比例", "800"), "")
  assert.equal(calculateImageHeight("1:1", ""), "")
})

test("摘要仅在填写有效宽度时展示像素尺寸", () => {
  assert.equal(formatImageSize("4:3", { width: "800" }), "800×600px")
  assert.equal(formatImageSize("4:3", { width: "" }), "4:3")
  assert.equal(formatImageSize("智能比例", { width: "800" }), "智能比例")
})

test("宽度选填，但填写后必须为正整数", () => {
  assert.equal(hasValidImageSize("4:3", { width: "" }), true)
  assert.equal(hasValidImageSize("智能比例", { width: "0" }), true)
  assert.equal(hasValidImageSize("4:3", { width: "800" }), true)
  assert.equal(hasValidImageSize("4:3", { width: "0" }), false)
  assert.equal(hasValidImageSize("4:3", { width: "1.5" }), false)
})
