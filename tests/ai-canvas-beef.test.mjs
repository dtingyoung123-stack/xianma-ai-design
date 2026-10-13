import test from "node:test"
import assert from "node:assert/strict"
import { resolveCanvasPointerIntent, resolveCanvasSelectionStrategy, applyCanvasSelectionStrategy, canvasSelectionHitsBounds, worldPoint, wheelViewport } from "../src/app/ai-canvas/beef-operations.mjs"

test("BeefTV pointer modes keep selection and navigation separate", () => {
  const input = { background: true, button: 0, pointerType: "mouse", boxSelectEnabled: true }
  assert.equal(resolveCanvasPointerIntent(input), "select")
  assert.equal(resolveCanvasPointerIntent({ ...input, spacePressed: true }), "pan")
  assert.equal(resolveCanvasPointerIntent({ ...input, button: 1, background: false }), "pan")
  assert.equal(resolveCanvasPointerIntent({ ...input, pointerType: "touch", background: false }), "ignore")
  assert.equal(resolveCanvasPointerIntent({ ...input, background: false }), "ignore")
})
test("selection modifier strategies preserve unaffected nodes", () => {
  assert.equal(resolveCanvasSelectionStrategy({ altKey: true, shiftKey: true }), "subtract")
  assert.deepEqual([...applyCanvasSelectionStrategy(["a", "b"], ["b", "c"], "toggle")], ["a", "c"])
  assert.deepEqual([...applyCanvasSelectionStrategy(["a", "b"], ["b"], "subtract")], ["a"])
  assert.equal(canvasSelectionHitsBounds({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 }), false)
})
test("wheel zoom preserves cursor's world point at both scale limits", () => {
  const viewport = { x: -150, y: 80, k: .7 }, point = { x: 540, y: 300 }
  for (const deltaY of [-100, 100, -100000, 100000]) {
    const next = wheelViewport(viewport, { deltaMode: 0, deltaX: 0, deltaY, ctrlKey: false }, point)
    assert.ok(next.k >= .05 && next.k <= 2)
    const a = worldPoint(point, viewport), b = worldPoint(point, next)
    assert.ok(Math.abs(a.x - b.x) < 1e-8 && Math.abs(a.y - b.y) < 1e-8)
  }
})
test("trackpad movement and Shift wheel pan without zooming", () => {
  const v = { x: 0, y: 0, k: 1 }
  assert.deepEqual(wheelViewport(v, { deltaMode: 0, deltaX: 12, deltaY: 6 }, { x: 0, y: 0 }), { x: -12, y: -6, k: 1 })
  assert.deepEqual(wheelViewport(v, { deltaMode: 0, deltaX: 0, deltaY: 100, shiftKey: true }, { x: 0, y: 0 }), { x: -100, y: 0, k: 1 })
})
