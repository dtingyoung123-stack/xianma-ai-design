import test from "node:test"
import assert from "node:assert/strict"
import { connectedImageReferences, appendCharacterVersion } from "../src/app/ai-canvas/character-views.mjs"

test("references only include incoming images with content", () => {
  const document = { nodes: [{ id: "source", type: "image", result: "source.png" }, { id: "empty", type: "image" }, { id: "text", type: "text", result: "text" }, { id: "other", type: "image", result: "other.png" }], edges: [{ source: "source", target: "target" }, { source: "empty", target: "target" }, { source: "text", target: "target" }, { source: "target", target: "other" }] }
  assert.deepEqual(connectedImageReferences(document, "target").map(node => node.id), ["source"])
})

test("regeneration preserves original and prior results in the same node", () => {
  const original = { id: "target", result: "original.png", width: 280 }
  const first = appendCharacterVersion(original, { id: "v1", result: "one.png" })
  const second = appendCharacterVersion(first, { id: "v2", result: "two.png" })
  assert.equal(second.id, "target")
  assert.equal(second.width, 280)
  assert.equal(second.activeVersion, "v2")
  assert.deepEqual(second.versions.map(version => version.result), ["original.png", "one.png", "two.png"])
  assert.equal(original.result, "original.png")
})

test("four views require an incoming populated image even when prompt text exists", async () => {
  const { characterGenerationBlock } = await import("../src/app/ai-canvas/character-views.mjs")
  const node = { id: "target", mode: "character-four-views", prompt: "a character" }
  const document = { nodes: [{ id: "text", type: "text", result: "description" }, { id: "empty", type: "image" }, { id: "photo", type: "image", result: "photo.png" }], edges: [{ source: "text", target: "target" }, { source: "empty", target: "target" }] }
  assert.equal(characterGenerationBlock(document, node), "请先关联角色参考图")
  document.edges.push({ source: "photo", target: "target" })
  assert.equal(characterGenerationBlock(document, node), "")
  document.edges.pop()
  assert.equal(characterGenerationBlock(document, node), "请先关联角色参考图")
  assert.equal(characterGenerationBlock(document, { ...node, mode: "standard" }), "")
})

test("multiple incoming images require a valid selection; deleted references cannot enable generation", async () => {
  const { characterGenerationBlock } = await import("../src/app/ai-canvas/character-views.mjs")
  const node = { id: "target", mode: "character-four-views" }
  const document = { nodes: [{ id: "a", type: "image", result: "a.png" }, { id: "b", type: "image", result: "b.png" }], edges: [{ source: "a", target: "target" }, { source: "b", target: "target" }] }
  assert.equal(characterGenerationBlock(document, node), "请选择一张关联角色参考图")
  assert.equal(characterGenerationBlock(document, { ...node, referenceId: "gone" }), "请选择一张关联角色参考图")
  assert.equal(characterGenerationBlock(document, { ...node, referenceId: "a" }), "")
  assert.equal(characterGenerationBlock({ ...document, nodes: [] }, { ...node, referenceId: "a" }), "请先关联角色参考图")
})

test("four-view preset locks its ratio without overwriting normal settings and unlocks on exit", async () => {
  const { imageCreationSettings, changeImageCreationSetting } = await import("../src/app/ai-canvas/character-views.mjs")
  const ordinary = { id: "target", mode: "standard", ratio: "9:16", resolution: "4K", count: 4, model: "GPT Image 2.5" }
  const preset = { ...ordinary, mode: "character-four-views" }
  assert.deepEqual(imageCreationSettings(preset), { model: "GPT Image 2.5", resolution: "1K", ratio: "3:2", count: 1, locked: true })
  for (const [key, value] of [["ratio", "1:1"], ["resolution", "2K"], ["count", 2]]) assert.equal(changeImageCreationSetting(preset, key, value), preset)
  const exited = { ...preset, mode: "standard" }
  assert.deepEqual(imageCreationSettings(exited), { model: "GPT Image 2.5", resolution: "4K", ratio: "9:16", count: 4, locked: false })
  assert.equal(imageCreationSettings(changeImageCreationSetting(exited, "ratio", "16:9")).ratio, "16:9")
  assert.equal(imageCreationSettings({ mode: "character-four-views" }).ratio, "3:2")
})

test("canvas input selection toggles the actual connection and changes four-view eligibility", async () => {
  const { toggleCanvasReference, characterGenerationBlock } = await import("../src/app/ai-canvas/character-views.mjs")
  const target = { id: "target", type: "image", mode: "character-four-views" }
  const original = { nodes: [target, { id: "source", type: "image", result: "image.png" }, { id: "empty", type: "image" }, { id: "text", type: "text", prompt: "character" }], edges: [] }
  assert.equal(toggleCanvasReference(original, "target", "target", "e0"), original)
  assert.equal(toggleCanvasReference(original, "target", "empty", "e0"), original)
  const withText = toggleCanvasReference(original, "target", "text", "e1")
  assert.equal(characterGenerationBlock(withText, target), "请先关联角色参考图")
  const withImage = toggleCanvasReference(withText, "target", "source", "e2")
  assert.equal(characterGenerationBlock(withImage, target), "")
  const removed = toggleCanvasReference(withImage, "target", "source", "e3")
  assert.deepEqual(removed.edges, withText.edges)
  assert.equal(characterGenerationBlock(removed, target), "请先关联角色参考图")
  assert.deepEqual(original.edges, [])
})

import { characterPromptSnapshot } from "../src/app/ai-canvas/character-views.mjs"

test("four-view requests append optional input once and keep immutable snapshots", () => {
  const base = "08 fixed template\n"
  assert.equal(characterPromptSnapshot(base).prompt, base)
  assert.equal(characterPromptSnapshot(base, "  \n ").prompt, base)
  const first = characterPromptSnapshot(base, "  米色短裤  ")
  assert.equal(first.userPrompt, "  米色短裤  ")
  assert.equal(first.prompt, base + "\n\n【用户补充要求】\n米色短裤")
  assert.deepEqual(characterPromptSnapshot(base, first.userPrompt), first)
  const second = characterPromptSnapshot(base, "蓝色裙装")
  assert.equal(first.prompt.includes("蓝色裙装"), false)
  assert.equal(second.basePrompt, base)
})
