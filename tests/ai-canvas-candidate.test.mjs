import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { constrainPanel, copySelection, intersects, zoomAtPoint } from '../public/prototypes/candidate/canvas-geometry.mjs'

test('面板在桌面及窄屏始终受视口约束', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 600 }, { width: 390, height: 700 }]) {
    const panel = constrainPanel({ left: -500, top: 2000, width: 1800, height: 1200 }, viewport)
    assert.ok(panel.left >= 12 && panel.top >= 12)
    assert.ok(panel.left + panel.width <= viewport.width - 12)
    assert.ok(panel.top + panel.height <= viewport.height - 12)
  }
})
test('鼠标缩放前后指向同一画布坐标', () => {
  const pan = { x: -80, y: 25 }, point = { x: 640, y: 320 }
  const next = zoomAtPoint(pan, .5, 1.8, point)
  assert.equal((point.x - pan.x) / .5, (point.x - next.x) / 1.8)
  assert.ok(Math.abs((point.y - pan.y) / .5 - (point.y - next.y) / 1.8) < 1e-9)
})
test('多节点粘贴保留内部连线并独立复制嵌套数据', () => {
  const nodes = [{ id: 'a', name: 'A', x: 0, y: 0, parents: ['external'], items: [{ name: '原始' }] }, { id: 'b', name: 'B', x: 10, y: 10, parents: ['a'] }]
  let id = 0
  const copied = copySelection(nodes, new Set(['a', 'b']), () => `copy-${++id}`)
  assert.deepEqual(copied[0].parents, [])
  assert.deepEqual(copied[1].parents, ['copy-1'])
  copied[0].items[0].name = '副本'
  assert.equal(nodes[0].items[0].name, '原始')
})
test('框选按相交范围选择节点', () => {
  assert.equal(intersects({ x: 0, y: 0, width: 100, height: 100 }, { x: 80, y: 90, width: 30, height: 30 }), true)
  assert.equal(intersects({ x: 0, y: 0, width: 100, height: 100 }, { x: 110, y: 110, width: 30, height: 30 }), false)
})
test('候选版保留旧版生成和保存逻辑，默认入口不切换', () => {
  const base = readFileSync('public/prototypes/xianma-ai-canvas-v1.html', 'utf8')
  const candidate = readFileSync('public/prototypes/xianma-ai-canvas-candidate.html', 'utf8')
  for (const name of ['runGenerate', 'saveToAsset', 'downloadMockImage', 'openProject']) {
    const start = base.indexOf(`function ${name}(`)
    const end = base.indexOf('\n    function ', start + 1)
    assert.ok(candidate.includes(base.slice(start, end)))
  }
  assert.ok(!base.includes('canvas-interactions.js'))
  const client = readFileSync('src/app/ai-canvas/CanvasProjectsClient.jsx', 'utf8')
  assert.ok(client.includes('candidate = false'))
  assert.ok(client.includes('src={candidate ?'))
})
