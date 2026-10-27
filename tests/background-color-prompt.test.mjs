import test from "node:test"
import assert from "node:assert/strict"
import { backgroundColorPrompt, insertBackgroundColorPrompt } from "../src/lib/background-color-prompt.mjs"

const color = { name: "蓝色", hex: "#20358A" }

test("页面使用固定文案，空指令也可独立换色", () => {
  assert.equal(backgroundColorPrompt("expert", color), "将背景底色更改为蓝色（#20358A），保持商品、文字、Logo、图标及排版不变。")
  assert.match(backgroundColorPrompt("batch-edit", color), /每张图片.*统一/)
  assert.match(backgroundColorPrompt("subject-replace", color), /完成主体替换/)
  assert.doesNotMatch(backgroundColorPrompt("subject-replace", color), /商品.*不变/)
  assert.equal(insertBackgroundColorPrompt("", "", "新指令"), "新指令")
})

test("重复选色替换原句，手工修改后的文本不覆盖，清空后可重新插入", () => {
  assert.equal(insertBackgroundColorPrompt("原要求\n旧指令", "旧指令", "新指令"), "原要求\n新指令")
  assert.equal(insertBackgroundColorPrompt("用户修改过的要求", "旧指令", "新指令"), "用户修改过的要求\n新指令")
  assert.equal(insertBackgroundColorPrompt("", "旧指令", "新指令"), "新指令")
})

 test("商详焕新统一整组背景，兼容保留和替换商品", () => {
  const text = backgroundColorPrompt("detail-refresh", color)
  assert.match(text, /整组详情图.*统一/)
  assert.match(text, /保留或替换/)
  assert.match(text, /不新增未提供的商品事实/)
})
