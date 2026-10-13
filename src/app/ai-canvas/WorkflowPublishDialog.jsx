"use client"
import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, Check, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import SafeImage from "@/components/SafeImage"
import OrganizationScopeSelector from "@/components/OrganizationScopeSelector"
import WorkbenchPickerDialog from "./WorkflowDialog"
import { organizationTree, companyOrganizationName } from "@/data/demo/admin"
import { workflowScenes, workflowUsers } from "@/data/demo/workflows"
import { assertPublicationCurrent, createExampleCase, executionOrder, inferInputs, organizationIds, validatePublication } from "@/lib/workflow-prototype.mjs"
import { saveWorkflows, useWorkflowStore } from "./workflow-store"
import styles from "./workflow.module.css"

export default function WorkflowPublishDialog({ graph, project, onClose }) {
  const store = useWorkflowStore()
  const user = workflowUsers.find(u => u.id === store.userId) || workflowUsers[0]
  const [opened] = useState(() => ({ user: structuredClone(user), template: structuredClone(store.templates.find(t => t.projectId === project.id)) }))
  const existing = opened.template
  const candidates = inferInputs(graph)
  const removedInputs = (existing?.inputs || []).filter(old => !candidates.some(i => i.nodeId === old.nodeId && i.type === old.type))
  const removedOutputs = (existing?.outputs || []).filter(old => !graph.nodes.some(n => n.id === old.nodeId && n.type === old.type))
  const [acknowledgedChanges, setAcknowledgedChanges] = useState(false)
  const [draft, setDraft] = useState(() => ({ includeExample: Boolean(existing?.exampleCase), name: existing?.name || project.name, description: existing?.description || "", cover: existing?.cover || graph.nodes.find(n => n.type === "image" && n.result)?.result || "", scenes: existing?.scenes || [], orgIds: existing?.orgIds || (organizationIds(organizationTree).includes(user.orgId) ? [user.orgId] : []), inputs: [...(existing?.inputs || []).filter(old => candidates.some(i => i.nodeId === old.nodeId && i.type === old.type)).map(old => ({ ...candidates.find(i => i.nodeId === old.nodeId), ...old })), ...candidates.filter(i => !existing?.inputs.some(old => old.nodeId === i.nodeId && old.type === i.type))], outputs: existing?.outputs.filter(o => graph.nodes.some(n => n.id === o.nodeId && n.type === o.type)) || [] }))
  const [step, setStep] = useState(0), [errors, setErrors] = useState([]), [busy, setBusy] = useState(false), [success, setSuccess] = useState(null)
  const pending = useRef(false)
  let order = [], graphError = ""
  try { order = executionOrder(graph) } catch (e) { graphError = e.message }
  const allowed = organizationIds(organizationTree)
  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  function changeInput(index, patch) { setDraft(d => ({ ...d, inputs: d.inputs.map((i, at) => at === index ? { ...i, ...patch } : i) })) }
  function move(index, direction) {
    const next = [...draft.inputs], target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]; set("inputs", next)
  }
  async function uploadCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setErrors(["请选择图片封面"]); return }
    const reader = new FileReader(); reader.onload = () => set("cover", reader.result); reader.onerror = () => setErrors(["封面读取失败，请重试"]); reader.readAsDataURL(file)
  }
  async function publish() {
    if (pending.current) return
    const issues = validatePublication(draft, graph, allowed)
    if ((removedInputs.length || removedOutputs.length) && !acknowledgedChanges) issues.push("请确认已失效的输入输出配置后再发布")
    if (!user.admin && !user.allowedScopeIds?.length) issues.push("当前身份无模板发布权限，请使用设计作者或管理员身份")
    if (issues.length) { setErrors(issues); return }
    pending.current = true; setBusy(true); setErrors([])
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const id = existing?.id || crypto.randomUUID()
      saveWorkflows(s => {
        const current = existing ? s.templates.find(t => t.id === id) : s.templates.find(t => t.projectId === project.id)
        assertPublicationCurrent(current, existing, s.userId, opened.user)
        const version = (current?.version || 0) + 1
        const next = { ...structuredClone(draft), inputs: draft.inputs.map(({ link, linkLabel, ...input }) => input), exampleCase: createExampleCase(draft, graph, version), id, graph: structuredClone(graph), projectId: project.id, authorId: existing?.authorId || user.id, authorName: existing?.authorName || user.name, version, status: "published", updatedAt: new Date().toISOString(), demoQuote: 20 }
        return { ...s, templates: [...s.templates.filter(t => t.id !== id), next] }
      })
      setSuccess(id)
    } catch (e) { setErrors([`发布失败：${e.message}。旧发布版本保持不变。`]) }
    finally { pending.current = false; setBusy(false) }
  }
  const close = () => { if (!pending.current) onClose() }
  return <WorkbenchPickerDialog title={success ? "模板已发布" : existing ? "更新发布" : "封装为模板"} eyebrow="工作流模板" description="将画布封装为同事可直接填写使用的模板，固定配置不会开放编辑。" width="1120px" onClose={close} footer={<div className={`${styles.scope} w-full`}><div className={styles.stack}>{!!errors.length && <div role={success ? "status" : "alert"} className={styles.notice}>{errors.map(error => <p key={error}>{error}</p>)}</div>}<div className={styles.row}>{success ? <><Button variant="outline" onClick={close}>返回画布</Button><a className={styles.primaryLink} href={`/ai-canvas?view=templates&template=${success}`}>查看模板</a></> : <><Button variant="outline" disabled={busy} onClick={close}>取消</Button><div className={styles.actions}>{step > 0 && <Button variant="outline" disabled={busy} onClick={() => setStep(step - 1)}>上一步</Button>}{step < 3 ? <Button onClick={() => setStep(step + 1)}>下一步</Button> : <Button disabled={busy} onClick={publish}>{busy ? "正在发布…" : existing ? existing.status === "unpublished" ? "更新并上架" : "确认更新并发布" : "发布模板"}</Button>}</div></>}</div></div></div>}>
    <div className={styles.scope}>
      {!success && (removedInputs.length > 0 || removedOutputs.length > 0) && <div role="alert" className={styles.notice}><p>当前画布存在已失效配置：{[...removedInputs, ...removedOutputs].map(i => i.label).join("、")}。这些配置将在更新时移除。</p><label><input type="checkbox" checked={acknowledgedChanges} onChange={e => setAcknowledgedChanges(e.target.checked)} />我已确认上述配置变更</label></div>}
      {success ? <div className={styles.empty}><Check size={36} /><h3>同事可以通过列表或链接使用</h3><p>已固化当前流程，新修改不会自动影响已发布模板。</p><label>系统生成的模板使用链接<input aria-label="模板使用链接" readOnly value={`${typeof location !== "undefined" ? location.origin : ""}/ai-canvas?view=templates&template=${success}`} /></label><Button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/ai-canvas?view=templates&template=${success}`); setErrors(["链接已复制"]) } catch { setErrors(["复制失败，请复制地址栏中的模板链接"]) } }}>复制使用链接</Button></div> : <>
        <nav className={styles.steps} aria-label="封装步骤">{["基本信息", "开放输入", "最终输出", "检查与发布"].map((label, i) => <button key={label} aria-current={step === i ? "step" : undefined} onClick={() => setStep(i)}><span>{i + 1}</span>{label}</button>)}</nav>
        <div className={styles.publishGrid}><div className={styles.stack}>
          {step === 0 && <>
            <label>模板名称<input value={draft.name} onChange={e => set("name", e.target.value)} /></label>
            <label>用途说明<textarea rows={3} placeholder="告诉同事能生成什么、适合什么场景" value={draft.description} onChange={e => set("description", e.target.value)} /></label>
            <fieldset><legend>使用场景（可多选）</legend><div className={styles.chips}>{workflowScenes.map(scene => <label key={scene}><input type="checkbox" checked={draft.scenes.includes(scene)} onChange={() => set("scenes", draft.scenes.includes(scene) ? draft.scenes.filter(s => s !== scene) : [...draft.scenes, scene])} />{scene}</label>)}</div></fieldset>
            <fieldset><legend>模板封面</legend><p className={styles.muted}>从当前画布选择图片，或上传新封面。</p><div className={styles.coverChoices}>{graph.nodes.filter(n => n.type === "image" && n.result).map(n => <button key={n.id} aria-label={`选择封面：${n.title}`} aria-pressed={draft.cover === n.result} onClick={() => set("cover", n.result)}><SafeImage src={n.result} alt={n.title} /><span>{n.title}</span></button>)}</div>{!graph.nodes.some(n => n.type === "image" && n.result) && <p className={styles.muted}>当前画布暂无图片，可上传封面。</p>}<label className={styles.upload}>上传封面<input type="file" accept="image/*" onChange={uploadCover} /></label></fieldset>
          </>}
          {step === 1 && <><h3>自动读取画布输入节点</h3><p className={styles.muted}>无上游的图片、文本节点自动绑定；名称和顺序只影响填写页。</p>{!draft.inputs.length && <p>没有可开放的图片或文本输入节点，请返回画布检查。</p>}{draft.inputs.map((input, i) => <section key={input.nodeId} className={styles.fieldCard}><div className={styles.row}><span className={styles.muted}>{graph.nodes.find(n => n.id === input.nodeId)?.title} · 节点 {graph.nodes.findIndex(n => n.id === input.nodeId) + 1} · {input.type === "image" ? "图片" : "文本"}</span><div className={styles.actions}><button aria-label={`上移${input.label}`} disabled={!i} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button aria-label={`下移${input.label}`} disabled={i === draft.inputs.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button></div></div><label>字段名称<input value={input.label} onChange={e => changeInput(i, { label: e.target.value })} /></label><div className={styles.chips}><label><input type="checkbox" checked={input.open} onChange={e => changeInput(i, { open: e.target.checked })} />开放给使用者</label>{input.open && <label><input type="checkbox" checked={input.required} onChange={e => changeInput(i, { required: e.target.checked })} />必填</label>}</div>{input.open ? <><label>素材准备说明<input value={input.help} onChange={e => changeInput(i, { help: e.target.value })} /></label></> : <p className={styles.muted}>固定使用发布时内容，不出现在同事填写页。</p>}</section>)}</>}
          {step === 2 && <><h3>选择最终交付结果</h3><p className={styles.muted}>支持多选。未选中的中间结果不对使用者展示。</p>{graph.nodes.filter(n => ["image", "video", "text"].includes(n.type) && graph.edges.some(e => e.target === n.id)).map(n => { const output = draft.outputs.find(o => o.nodeId === n.id); return <section className={styles.fieldCard} key={n.id}><label className={styles.checkLabel}><input type="checkbox" checked={Boolean(output)} onChange={() => set("outputs", output ? draft.outputs.filter(o => o.nodeId !== n.id) : [...draft.outputs, { nodeId: n.id, type: n.type, label: n.title }])} />{n.title} · {n.type} · 节点 {graph.nodes.findIndex(node => node.id === n.id) + 1}</label>{output && <label>交付名称<input value={output.label} onChange={e => set("outputs", draft.outputs.map(o => o.nodeId === n.id ? { ...o, label: e.target.value } : o))} /></label>}</section> })}{!graph.edges.length && <p>暂无连接的结果节点，请先在画布连接输入和输出。</p>}<ol aria-label="最终输出顺序">{draft.outputs.map((o, i) => <li key={o.nodeId}>{i + 1}. {o.label} {i > 0 && <button aria-label={`上移${o.label}`} title={`上移${o.label}`} onClick={() => { const next = [...draft.outputs]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set("outputs", next) }}><ArrowUp size={16} /></button>}</li>)}</ol></>}
          {step === 3 && <><h3>可见组织与发布检查</h3><label className={styles.checkLabel}><input type="checkbox" checked={draft.includeExample} onChange={e => set("includeExample", e.target.checked)} />将本次画布作为示范案例，帮助使用者了解输入与输出</label><p className={styles.muted}>自动保存本次画布输入与最终输出，随发布版本固定，无需额外上传。</p><OrganizationScopeSelector organizations={organizationTree} organizationLabel={companyOrganizationName} value={draft.orgIds} onChange={value => set("orgIds", value)} allowedScopeIds={null} /><p className={styles.muted}>内部模板检查通过后直接发布，无需审批。更新仅影响后续新任务。</p></>}
        </div><aside className={styles.preview}><div className={styles.row}><h3>发布预览</h3><Workflow size={18} /></div>{draft.cover && <SafeImage className={styles.previewCover} src={draft.cover} alt="模板封面" />}<h3>{draft.name || "未命名模板"}</h3><p className={styles.muted}>{draft.description || "填写用途说明，帮助同事选择模板"}</p>{<><h4>执行依赖顺序</h4>{graphError ? <p role="alert">{graphError}</p> : <ol className={styles.flow}>{order.map(id => { const n = graph.nodes.find(n => n.id === id); return <li key={id}><span>{n.type}</span>{n.title}</li> })}</ol>}<h4>最终交付 · {draft.outputs.length} 项</h4>{draft.outputs.map(o => <p key={o.nodeId}>{o.label} · {o.type}</p>)}</>}</aside></div>
      </>}
    </div>
  </WorkbenchPickerDialog>
}
