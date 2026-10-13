/* Candidate interaction layer: business actions stay in the original prototype.
 * BeefTV v1.5.5 informs panel gestures and comparison UX; geometry license nearby.
 * Runtime bridge is candidate-only, not a production API or task service.
 */
import { clamp, constrainPanel, copySelection, intersects, zoomAtPoint } from './canvas-geometry.mjs'

const runtime = window.xianmaCanvasRuntime
const { state } = runtime
const selected = new Set()
let tool = 'move'
let gesture = null
let spacePressed = false
let clipboard = null
let history = []
let historyIndex = -1
let restoring = false
let generationObserved = false
let leftId = null
let rightId = null
let previousFocus = null
let panelLayout = null
const $ = selector => document.querySelector(selector)
const editable = target => target.closest('input,textarea,select,[contenteditable=true]')
const interactive = target => target.closest('button,input,textarea,select,a,[contenteditable=true],.node-inline-config,.candidate-window,.candidate-toolbar')
const viewport = () => ({ width: innerWidth, height: innerHeight })
const toolbar = document.createElement('div')
toolbar.className = 'candidate-toolbar'
toolbar.setAttribute('role', 'toolbar')
toolbar.setAttribute('aria-label', '画布交互工具')
toolbar.innerHTML = `<button data-candidate="move" aria-pressed="true" title="拖动空白平移；空格临时平移">平移</button><button data-candidate="select" aria-pressed="false" title="拖动空白框选；Shift追加选择">框选</button><span class="candidate-count">未选中</span><button data-candidate="align">顶部对齐</button><button data-candidate="arrange">排列</button><button data-candidate="copy">复制</button><button data-candidate="paste">粘贴</button><button data-candidate="compare">对比</button><button data-candidate="help">快捷键</button>`
document.body.append(toolbar)
const label = document.createElement('span')
label.className = 'candidate-label'
label.textContent = '交互候选版 · 本地原型'
document.body.append(label)
const box = document.createElement('div')
box.className = 'candidate-box'
box.hidden = true
document.body.append(box)
const panel = document.createElement('section')
panel.className = 'candidate-window'
panel.hidden = true
panel.tabIndex = -1
panel.setAttribute('role', 'dialog')
panel.setAttribute('aria-label', '版本并排对比')
panel.innerHTML = `<header><strong>版本对比</strong><button data-panel="swap">交换</button><button data-panel="reset">恢复位置</button><button data-panel="close" aria-label="关闭版本对比">关闭</button></header><main></main><footer><span>仅对照查看，保存与下载沿用原流程</span><button class="candidate-resize" data-panel="resize" aria-label="调整对比窗口尺寸" title="拖动调整；方向键调整，Shift加速">↘</button></footer>`
document.body.append(panel)
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function snapshot() {
  return JSON.stringify({ nodes: state.nodes, groups: state.groups, promptDrafts: state.promptDrafts, paramPrefs: state.paramPrefs })
}
function checkpoint() {
  if (restoring) return
  if (state.nodes.some(node => ['queued', 'processing'].includes(node.status))) { generationObserved = true; return }
  // A completed mock generation becomes a new editing baseline, not an undoable service action.
  if (generationObserved) { history = []; historyIndex = -1; generationObserved = false }
  const next = snapshot()
  if (history[historyIndex] === next) return
  history = history.slice(0, historyIndex + 1)
  history.push(next)
  if (history.length > 40) history.shift()
  historyIndex = history.length - 1
}
function undo(delta) {
  if (state.nodes.some(node => ['queued', 'processing'].includes(node.status))) return runtime.toast('生成中暂不撤销画布编辑')
  const index = historyIndex + delta
  if (index < 0 || index >= history.length) return runtime.toast(delta < 0 ? '没有可撤销的编辑' : '没有可重做的编辑')
  restoring = true
  const restored = JSON.parse(history[index])
  Object.assign(state, restored)
  historyIndex = index
  selected.clear()
  state.selected = null
  state.openConfigNode = null
  runtime.renderAll()
  restoring = false
  if (!panel.hidden) renderComparison()
}
function nodeRect(node) {
  const element = document.querySelector(`[data-node="${CSS.escape(node.id)}"]`)
  return { x: node.x, y: node.y, width: node.width || element?.offsetWidth || runtime.nodeMetrics().nodeW, height: element?.offsetHeight || runtime.nodeMetrics().nodeH }
}
function paintSelection() {
  toolbar.hidden = state.view !== 'canvas'
  label.hidden = state.view !== 'canvas'
  for (const id of selected) if (!state.nodes.some(node => node.id === id)) selected.delete(id)
  document.querySelectorAll('.node').forEach(element => {
    const active = selected.has(element.dataset.node)
    element.classList.toggle('candidate-selected', active)
    if (active && !element.querySelector('.candidate-node-resize')) {
      const handle = document.createElement('button')
      handle.className = 'candidate-node-resize'
      handle.setAttribute('aria-label', '调整节点宽度')
      handle.title = '拖动调整节点宽度'
      element.append(handle)
    } else if (!active) element.querySelector('.candidate-node-resize')?.remove()
  })
  toolbar.querySelector('.candidate-count').textContent = selected.size ? `已选 ${selected.size} 项` : '未选中'
  toolbar.querySelector('[data-candidate=align]').disabled = selected.size < 2
  toolbar.querySelector('[data-candidate=arrange]').disabled = selected.size < 2
  toolbar.querySelector('[data-candidate=copy]').disabled = !selected.size
  toolbar.querySelector('[data-candidate=paste]').disabled = !clipboard?.length
  toolbar.querySelector('[data-candidate=compare]').disabled = !state.nodes.some(node => node.kind !== 'text' && !['queued', 'processing', 'failed'].includes(node.status))
}
function onRender() { paintSelection() }
window.canvasCandidate = { onRender }
function choose(id, additive = false) {
  if (!additive) selected.clear()
  if (id) {
    if (additive && selected.has(id)) selected.delete(id)
    else selected.add(id)
  }
  state.selected = selected.values().next().value || null
  paintSelection()
}
function copy() {
  if (!selected.size) return
  if (state.nodes.some(node => selected.has(node.id) && ['queued', 'processing'].includes(node.status))) return runtime.toast('请等待选中节点生成完成后再复制')
  clipboard = structuredClone(state.nodes.filter(node => selected.has(node.id)))
  paintSelection()
  runtime.toast(`已复制 ${clipboard.length} 个节点，粘贴时保留内部连线`)
}
function paste() {
  if (!clipboard?.length) return
  const nodes = copySelection(clipboard, new Set(clipboard.map(node => node.id)), () => 'n' + state.nextId++)
  state.nodes.push(...nodes)
  selected.clear()
  nodes.forEach(node => selected.add(node.id))
  state.selected = nodes[0].id
  state.openConfigNode = null
  runtime.renderAll()
  checkpoint()
}
function arrange(align) {
  const nodes = state.nodes.filter(node => selected.has(node.id))
  if (nodes.length < 2) return
  const top = Math.min(...nodes.map(node => node.y))
  let x = Math.min(...nodes.map(node => node.x))
  nodes.forEach(node => { node.y = top; if (!align) { node.x = x; x += nodeRect(node).width + 48 } })
  runtime.renderAll()
  checkpoint()
}
function setTool(next) {
  tool = next
  for (const button of toolbar.querySelectorAll('[aria-pressed]')) button.setAttribute('aria-pressed', String(button.dataset.candidate === tool))
  $('#canvasWrap').style.cursor = tool === 'select' ? 'crosshair' : 'grab'
}
function availableResults() {
  return state.nodes.filter(node => node.kind !== 'text' && !['queued', 'processing', 'failed'].includes(node.status))
}
function resetLayout() {
  panelLayout = constrainPanel({ left: (innerWidth - 900) / 2, top: 84, width: 900, height: 560 }, viewport())
  applyPanelLayout()
}
function applyPanelLayout() {
  panelLayout = constrainPanel(panelLayout, viewport())
  Object.assign(panel.style, Object.fromEntries(Object.entries(panelLayout).map(([key, value]) => [key, `${value}px`])))
}
function renderComparison() {
  const nodes = availableResults()
  const ids = [leftId, rightId]
  const main = panel.querySelector('main')
  main.replaceChildren()
  for (let side = 0; side < 2; side++) {
    const node = nodes.find(node => node.id === ids[side])
    const article = document.createElement('article')
    const select = document.createElement('select')
    select.setAttribute('aria-label', side === 0 ? '左侧对比结果' : '右侧对比结果')
    select.innerHTML = `<option value="">选择对比图片</option>` + nodes.map(node => `<option value="${escapeHtml(node.id)}">${escapeHtml(node.name)}</option>`).join('')
    select.value = node?.id || ''
    select.onchange = () => { if (side === 0) leftId = select.value; else rightId = select.value; delete panel.dataset[side === 0 ? 'leftSlot' : 'rightSlot']; renderComparison() }
    article.append(select)
    const preview = document.createElement('div')
    preview.className = 'candidate-compare-preview'
    if (node) preview.innerHTML = runtime.nodePreviewHtml(node)
    else preview.textContent = '请选择图片；已删除的结果不会继续显示'
    preview.querySelectorAll('img').forEach(image => image.addEventListener('error', () => { preview.textContent = '图片加载失败，请更换对比图片' }, { once: true }))
    article.append(preview)
    if (node) {
      const data = document.createElement('dl')
      const params = state.paramPrefs[`image:${node.action}`]
      data.innerHTML = [['来源', node.source], ['动作', node.action], ['候选', node.items?.length > 1 ? `${(node.activeIndex || 0) + 1}/${node.items.length}` : '单图'], ['提示词', state.promptDrafts[`${node.id}:${node.action}`] || node.text || '未记录'], ['参数', params ? JSON.stringify(params) : '未记录']].map(([key, value]) => `<dt>${key}</dt><dd>${escapeHtml(value)}</dd>`).join('')
      article.append(data)
      if (node.items?.length > 1) {
        const candidates = document.createElement('select')
        candidates.setAttribute('aria-label', side === 0 ? '左侧候选图片' : '右侧候选图片')
        candidates.innerHTML = node.items.map((item, index) => `<option value="${index}">候选 ${index + 1} · ${escapeHtml(item.name || '')}</option>`).join('')
        candidates.value = String(side === 0 ? panel.dataset.leftSlot || node.activeIndex || 0 : panel.dataset.rightSlot || node.activeIndex || 0)
        const localNode = { ...node, activeIndex: Number(candidates.value) }
        preview.innerHTML = runtime.nodePreviewHtml(localNode)
        candidates.onchange = () => { panel.dataset[side === 0 ? 'leftSlot' : 'rightSlot'] = candidates.value; renderComparison() }
        article.prepend(candidates)
      }
    }
    main.append(article)
  }
}
function openComparison() {
  const candidates = availableResults()
  const chosen = candidates.filter(node => selected.has(node.id))
  leftId = chosen[0]?.id || candidates[0]?.id || null
  rightId = chosen[1]?.id || candidates.find(node => node.id !== leftId)?.id || null
  delete panel.dataset.leftSlot
  delete panel.dataset.rightSlot
  previousFocus = document.activeElement
  panel.hidden = false
  if (!panelLayout) {
    try { panelLayout = JSON.parse(localStorage.getItem('xianma:canvas-candidate:compare-layout')) } catch { /* Invalid UI preference falls back to default. */ }
    if (!panelLayout || !['left', 'top', 'width', 'height'].every(key => Number.isFinite(panelLayout[key]))) resetLayout()
  }
  applyPanelLayout()
  renderComparison()
  panel.querySelector('select')?.focus()
}
function closeComparison() { panel.hidden = true; previousFocus?.focus?.() }

toolbar.addEventListener('click', event => {
  const action = event.target.closest('[data-candidate]')?.dataset.candidate
  if (action === 'move' || action === 'select') setTool(action)
  if (action === 'copy') copy()
  if (action === 'paste') paste()
  if (action === 'align' || action === 'arrange') arrange(action === 'align')
  if (action === 'compare') openComparison()
  if (action === 'help') runtime.toast('V平移 / B框选 / Shift多选 / 空格平移 / Ctrl+C、V复制粘贴 / Ctrl+Z撤销 / Delete删除 / Esc关闭')
})
panel.addEventListener('click', event => {
  const action = event.target.closest('[data-panel]')?.dataset.panel
  if (action === 'close') closeComparison()
  if (action === 'reset') resetLayout()
  if (action === 'swap') { [leftId, rightId] = [rightId, leftId]; const slot = panel.dataset.leftSlot; panel.dataset.leftSlot = panel.dataset.rightSlot || ''; panel.dataset.rightSlot = slot || ''; renderComparison() }
})

window.addEventListener('pointerdown', event => {
  if (![0, 1].includes(event.button) || editable(event.target)) return
  const nodeElement = event.target.closest('.node')
  const panelResize = event.target.closest('[data-panel=resize]')
  const panelHeader = event.target.closest('.candidate-window header')
  if (panelResize || (panelHeader && !event.target.closest('button'))) {
    event.preventDefault(); event.stopImmediatePropagation()
    gesture = { type: panelResize ? 'panel-resize' : 'panel-move', x: event.clientX, y: event.clientY, layout: { ...panelLayout } }
    panel.setPointerCapture(event.pointerId)
    return
  }
  if (interactive(event.target) && !event.target.closest('.candidate-node-resize,[data-connect-node]')) return
  if (!event.target.closest('#canvasWrap')) return
  event.preventDefault(); event.stopImmediatePropagation()
  runtime.clearLegacyDrag()
  const point = runtime.canvasPointFromClient(event.clientX, event.clientY)
  const connector = event.target.closest('[data-connect-node]')
  if (connector) {
    choose(connector.dataset.connectNode)
    gesture = { type: 'connect', id: connector.dataset.connectNode, x: event.clientX, y: event.clientY }
  } else if (event.button === 1 || spacePressed || (!nodeElement && tool === 'move')) {
    gesture = { type: 'pan', x: event.clientX, y: event.clientY, pan: { ...state.pan } }
  } else if (nodeElement) {
    const id = nodeElement.dataset.node
    if (event.shiftKey) { choose(id, true); return }
    if (!selected.has(id)) choose(id)
    const node = state.nodes.find(node => node.id === id)
    state.collapsed = true
    gesture = event.target.closest('.candidate-node-resize')
      ? { type: 'node-resize', id, x: event.clientX, width: nodeRect(node).width }
      : { type: 'nodes', x: event.clientX, y: event.clientY, nodes: state.nodes.filter(node => selected.has(node.id)).map(node => ({ id: node.id, x: node.x, y: node.y })) }
    state.openConfigNode = null
  } else {
    if (!event.shiftKey) choose(null)
    gesture = { type: 'box', x: event.clientX, y: event.clientY, point, existing: [...selected] }
  }
  gesture.pointerId = event.pointerId
  $('#canvasWrap').setPointerCapture(event.pointerId)
}, true)

window.addEventListener('pointermove', event => {
  if (!gesture) return
  event.preventDefault(); event.stopImmediatePropagation()
  const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y
  if (Math.hypot(dx, dy) > 4) gesture.moved = true
  if (gesture.type === 'pan') {
    state.pan = { x: gesture.pan.x + dx, y: gesture.pan.y + dy }
    $('#canvas').style.transform = `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`
    runtime.renderMinimap()
  }
  if (gesture.type === 'nodes') {
    for (const original of gesture.nodes) {
      const node = state.nodes.find(node => node.id === original.id)
      if (node) { node.x = original.x + dx / state.zoom; node.y = original.y + dy / state.zoom }
    }
    runtime.renderCanvas(); runtime.renderMinimap()
  }
  if (gesture.type === 'node-resize') {
    state.nodes.find(node => node.id === gesture.id).width = clamp(gesture.width + dx / state.zoom, 260, 1200)
    runtime.renderCanvas()
  }
  if (gesture.type === 'connect') {
    const point = runtime.canvasPointFromClient(event.clientX, event.clientY)
    const target = runtime.findConnectTarget(point, gesture.id)
    state.connectHover = target?.node.id || null
    state.tempEdge = { from: gesture.id, x: point.x, y: point.y }
    runtime.renderCanvas()
  }
  if (gesture.type === 'box') {
    box.hidden = false
    Object.assign(box.style, { left: `${Math.min(gesture.x, event.clientX)}px`, top: `${Math.min(gesture.y, event.clientY)}px`, width: `${Math.abs(dx)}px`, height: `${Math.abs(dy)}px` })
    const current = runtime.canvasPointFromClient(event.clientX, event.clientY)
    const bounds = { x: Math.min(current.x, gesture.point.x), y: Math.min(current.y, gesture.point.y), width: Math.abs(current.x - gesture.point.x), height: Math.abs(current.y - gesture.point.y) }
    selected.clear(); gesture.existing.forEach(id => selected.add(id))
    state.nodes.filter(node => intersects(bounds, nodeRect(node))).forEach(node => selected.add(node.id))
    paintSelection()
  }
  if (gesture.type.startsWith('panel-')) {
    panelLayout = constrainPanel(gesture.type === 'panel-move' ? { ...gesture.layout, left: gesture.layout.left + dx, top: gesture.layout.top + dy } : { ...gesture.layout, width: gesture.layout.width + dx, height: gesture.layout.height + dy }, viewport())
    applyPanelLayout()
  }
}, true)

function endGesture(event, cancelled = false) {
  if (!gesture) return
  event.stopImmediatePropagation()
  const current = gesture
  gesture = null
  if (current.type === 'connect' && !cancelled) {
    const point = runtime.canvasPointFromClient(event.clientX, event.clientY)
    const hit = runtime.findConnectTarget(point, current.id)
    if (hit && current.moved) {
      const parents = hit.node.parents || (hit.node.parent ? [hit.node.parent] : [])
      hit.node.parents = [...new Set([...parents, current.id])]
      hit.node.parent ||= current.id
    } else {
      state.addLinkParent = current.id
      runtime.showAddMenu(event.clientX, event.clientY)
    }
  }
  if (current.type === 'nodes' && !current.moved && !cancelled) {
    state.openConfigNode = state.selected
    runtime.renderAll()
  }
  state.tempEdge = null; state.connectHover = null
  box.hidden = true
  state.selected = selected.values().next().value || null
  if (current.type.startsWith('panel-')) {
    try { localStorage.setItem('xianma:canvas-candidate:compare-layout', JSON.stringify(panelLayout)) } catch { /* Storage is optional. */ }
  } else { runtime.renderCanvas(); runtime.renderMinimap(); checkpoint() }
  if ($('#canvasWrap').hasPointerCapture(event.pointerId)) $('#canvasWrap').releasePointerCapture(event.pointerId)
  if (panel.hasPointerCapture(event.pointerId)) panel.releasePointerCapture(event.pointerId)
  // Suppress the synthesized click after a drag; preserve subsequent business clicks.
  window.skipPanClick = true
  window.skipConnectorClick = true
  setTimeout(() => { window.skipPanClick = false; window.skipConnectorClick = false }, 0)
}
window.addEventListener('pointerup', event => endGesture(event), true)
window.addEventListener('pointercancel', event => endGesture(event, true), true)
window.addEventListener('blur', () => { gesture = null; box.hidden = true; spacePressed = false; state.tempEdge = null; runtime.renderCanvas() })
window.addEventListener('wheel', event => {
  if (!event.target.closest('#canvasWrap') || interactive(event.target)) return
  event.preventDefault(); event.stopImmediatePropagation()
  const old = state.zoom
  state.zoom = clamp(old * Math.exp(-event.deltaY * .0015), .2, 2.5)
  const rect = $('#canvasWrap').getBoundingClientRect()
  state.pan = zoomAtPoint(state.pan, old, state.zoom, { x: event.clientX - rect.left, y: event.clientY - rect.top })
  runtime.renderAll()
}, { capture: true, passive: false })
window.addEventListener('click', event => {
  const button = event.target.closest('#undoBtn,#redoBtn,#copyBtn,[data-mode]')
  if (button) {
    event.preventDefault(); event.stopImmediatePropagation()
    if (button.dataset.mode) setTool(button.dataset.mode === 'pan' ? 'move' : 'select')
    else if (button.id === 'copyBtn') { copy(); paste() } else undo(button.id === 'undoBtn' ? -1 : 1)
    return
  }
  if (event.target.closest('.candidate-toolbar,.candidate-window')) return
  // The legacy business action finishes synchronously before the checkpoint.
  setTimeout(() => { checkpoint(); if (!panel.hidden) renderComparison() }, 0)
}, true)
window.addEventListener('keydown', event => {
  if (!panel.hidden && event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeComparison(); return }
  if (editable(event.target)) return
  if (event.target.closest('#modalMask.show,.region-editor')) return
  const command = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  if (!panel.hidden && (event.key === 'Escape' || event.target.closest('.candidate-window'))) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeComparison() }
    if (event.target.closest('[data-panel=resize]') && event.key.startsWith('Arrow')) {
      event.preventDefault(); event.stopImmediatePropagation()
      const delta = event.shiftKey ? 40 : 10
      panelLayout.width += event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0
      panelLayout.height += event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0
      applyPanelLayout()
    }
    return
  }
  const handled = (command && ['c', 'v', 'z', 'y', '0'].includes(key)) || ['Delete', 'Backspace', 'Escape', ' '].includes(event.key) || (!command && ['v', 'b'].includes(key))
  if (!handled) return
  event.preventDefault(); event.stopImmediatePropagation()
  if (command && key === 'c') copy()
  else if (command && key === 'v') paste()
  else if (command && (key === 'z' || key === 'y')) undo(key === 'y' || event.shiftKey ? 1 : -1)
  else if (command && key === '0') runtime.fitCanvas()
  else if (event.key === ' ') spacePressed = true
  else if (event.key === 'Escape') { choose(null); state.openConfigNode = null; runtime.hideMenu(); runtime.hideAddMenu(); runtime.hideParamPopover(); runtime.hideModelMenu(); runtime.hideGuidePopover(); runtime.renderCanvas() }
  else if (event.key === 'Delete' || event.key === 'Backspace') {
    if (!selected.size) return
    if (state.nodes.some(node => selected.has(node.id) && ['queued', 'processing'].includes(node.status))) return runtime.toast('请等待选中节点生成完成后再删除')
    for (const id of [...selected]) runtime.deleteNode(id)
    choose(null); checkpoint()
  } else setTool(key === 'b' ? 'select' : 'move')
}, true)
window.addEventListener('keyup', event => { if (event.code === 'Space') spacePressed = false })
window.addEventListener('resize', () => { if (panelLayout) applyPanelLayout() })
window.addEventListener('contextmenu', () => {
  const menu = $('#contextMenu')
  if (menu.style.display !== 'block') return
  const rect = menu.getBoundingClientRect()
  menu.style.left = `${clamp(rect.left, 12, Math.max(12, innerWidth - rect.width - 12))}px`
  menu.style.top = `${clamp(rect.top, 12, Math.max(12, innerHeight - rect.height - 12))}px`
})
new MutationObserver(() => {
  // Context-menu selection should be reflected without rewriting business actions.
  if (!gesture && state.selected && !selected.has(state.selected)) { selected.clear(); selected.add(state.selected) }
  paintSelection()
  if (!gesture) checkpoint()
}).observe($('#nodesLayer'), { childList: true })
paintSelection()
checkpoint()
setTool('move')
