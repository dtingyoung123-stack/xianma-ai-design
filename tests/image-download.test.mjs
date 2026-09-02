import assert from "node:assert/strict"
import test from "node:test"

import {
  buildImageFilename,
  sanitizeImageName,
  stripFileExtension,
  uniquifyImageFilenames,
} from "../src/lib/image-download.js"

test("按展示名称和实际图片格式生成下载名称", () => {
  assert.equal(buildImageFilename({ name: "厨房收纳主图", mime: "image/webp" }), "厨房收纳主图.webp")
  assert.equal(buildImageFilename({ name: "图片.png", mime: "image/webp" }), "图片.webp")
  assert.equal(buildImageFilename({ name: "图片.png.webp", mime: "image/jpeg" }), "图片.jpg")
})

test("清理 Windows 非法字符且保留普通版本号", () => {
  assert.equal(sanitizeImageName('厨房/收纳:*?"<>|主图'), "厨房-收纳-------主图")
  assert.equal(stripFileExtension("商品图-v1.2"), "商品图-v1.2")
})

test("空名称回退为功能名称和一位序号", () => {
  assert.equal(buildImageFilename({ name: "", mime: "image/png", featureName: "主体替换", index: 2 }), "主体替换-3.png")
})

test("ZIP 内同名图片按两位序号依次命名", () => {
  assert.deepEqual(
    uniquifyImageFilenames([
      { name: "厨房主图.png", mime: "image/webp" },
      { name: "厨房主图", mime: "image/webp" },
      { name: "厨房主图.webp", mime: "image/webp" },
    ]),
    ["厨房主图-01.webp", "厨房主图-02.webp", "厨房主图-03.webp"],
  )
})
