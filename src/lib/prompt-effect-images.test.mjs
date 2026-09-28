import test from "node:test"
import assert from "node:assert/strict"
import { validatePromptEffectFiles, PROMPT_EFFECT_IMAGE_MAX_BYTES } from "./prompt-effect-images.mjs"

const file = { type: "image/png", size: 1024 }
test("效果图可选，允许分批添加至三张，超量整批拒绝", () => {
  assert.equal(validatePromptEffectFiles([], 0), "")
  assert.equal(validatePromptEffectFiles([file, file], 1), "")
  assert.match(validatePromptEffectFiles([file, file], 2), /最多上传 3 张/)
  assert.match(validatePromptEffectFiles([file, file, file, file], 0), /最多上传 3 张/)
})
test("满三张仍允许单张替换，禁止批量替换", () => {
  assert.equal(validatePromptEffectFiles([file], 3, true), "")
  assert.match(validatePromptEffectFiles([file, file], 3, true), /一张/)
})
test("空文件、超限及混入不支持格式的批次均拒绝", () => {
  assert.match(validatePromptEffectFiles([file, { ...file, type: "image/svg+xml" }], 0), /JPG 或 PNG/)
  assert.match(validatePromptEffectFiles([{ ...file, size: 0 }], 0), /20MB/)
  assert.match(validatePromptEffectFiles([{ ...file, size: PROMPT_EFFECT_IMAGE_MAX_BYTES + 1 }], 0), /20MB/)
  assert.equal(validatePromptEffectFiles([{ ...file, size: PROMPT_EFFECT_IMAGE_MAX_BYTES }], 0), "")
})
