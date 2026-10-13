"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Clock3, Copy, Download, FileText, Image as ImageIcon, Play, Search, Workflow } from "lucide-react"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import OrganizationScopeSelector from "@/components/OrganizationScopeSelector"
import WorkbenchPickerDialog from "./WorkflowDialog"
import { WorkbenchModule } from "@/components/workbench/Workbench"
import { organizationTree, companyOrganizationName } from "@/data/demo/admin"
import { workflowUsers, workflowScenes, workflowDemoGraph, workflowTaskExamples } from "@/data/demo/workflows"
import { initialCanvasFolders, initialCanvasProjects } from "@/data/demo/ai-canvas-projects"
import { assertSubmissionIdentity, assertManagementCurrent, outputText, acceptTask, canManage, canUse, organizationIds, taskState, validatePublication } from "@/lib/workflow-prototype.mjs"
import { saveWorkflows, useWorkflowStore } from "./workflow-store"
import styles from "./workflow.module.css"

const scenarioOptions = [["normal", "正常流程"], ["insufficient", "积分不足"], ["quote-failure", "费用获取失败"], ["run-failure", "任务执行失败"], ["save-failure", "管理保存失败"], ["list-failure", "列表加载失败"]]
const scenarioHints = { insufficient: "进入模板使用页可查看积分不足，运行按钮不可用。", "quote-failure": "进入模板使用页可查看费用获取失败及重试。", "run-failure": "进入模板提交运行，任务完成后显示执行失败。", "save-failure": "已启用管理保存失败演示：点击可见组织、下架或重新上架，在弹窗中确认后显示保存失败；原数据保持不变。", "list-failure": "已启用列表加载失败演示，可点击重试恢复列表。" }
const labels = { queued: "排队中", running: "执行中", succeeded: "已完成", failed: "失败", cancelled: "已取消" }
function navigate(params) {
  const url = new URL(location.href); url.search = new URLSearchParams({ view: "templates", ...params }).toString()
  history.pushState({ ...history.state }, "", url); window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }))
}
function formatTime(time) { return new Date(time).toLocaleString("zh-CN", { hour12: false }) }

export default function WorkflowHub() {
  const store = useWorkflowStore(), user = workflowUsers.find(u => u.id === store.userId) || workflowUsers[0]
  const [params, setParams] = useState({}), [query, setQuery] = useState(""), [scene, setScene] = useState(""), [notice, setNotice] = useState(""), [manage, setManage] = useState(null), [orgs, setOrgs] = useState([]), [busy, setBusy] = useState(false), [now, setNow] = useState(0)
  const [scenario, setScenario] = useState("normal")
  const [recordMode, setRecordMode] = useState("records")
  const lock = useRef(false)
  useEffect(() => {
    const sync = () => setParams(Object.fromEntries(new URLSearchParams(location.search)))
    sync(); window.addEventListener("popstate", sync)
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { window.removeEventListener("popstate", sync); clearInterval(timer) }
  }, [])
  const tab = params.tab || "available", template = store.templates.find(t => t.id === params.template)
  const ownTasks = store.tasks.filter(t => t.ownerId === user.id)
  const demoTasks = user.id ? workflowTaskExamples.map(t => ({ ...t, id: `demo:${user.id}:${t.id}`, ownerId: user.id })) : []
  const listedTasks = recordMode === "empty" ? [] : ownTasks.length ? ownTasks : demoTasks
  const task = [...ownTasks, ...demoTasks].find(t => t.id === params.task)
  function mutate(fn) { try { saveWorkflows(fn); setNotice("") ; return true } catch (e) { setNotice(`保存失败：${e.message}，原数据未改变。`); return false } }
  function openManage(t, action) { setNotice(""); setManage({ template: t, action, userId: user.id }); setOrgs(t.orgIds) }
  async function confirmManage() {
    if (lock.current) return
    lock.current = true; setBusy(true)
    await new Promise(resolve => setTimeout(resolve, 250))
    try {
      if (scenario === "save-failure") throw new Error("保存暂时失败，请重试")
      const allowed = organizationIds(organizationTree)
      if (manage.action === "org" && (!orgs.length || orgs.some(id => !allowed.includes(id)))) throw new Error("请选择至少一个有效的可授权组织")
      const ok = mutate(s => {
        const current = s.templates.find(t => t.id === manage.template.id)
        assertManagementCurrent(current, manage.template, s.userId, user)
        return { ...s, templates: s.templates.map(t => {
        if (t.id !== manage.template.id) return t
        if (!canManage(t, user)) throw new Error("没有管理权限")
        if (manage.action === "publish") { const errors = validatePublication(t, t.graph, allowed); if (errors.length) throw new Error(errors.join("；")) }
        return { ...t, ...(manage.action === "org" ? { orgIds: orgs } : { status: manage.action === "publish" ? "published" : "unpublished" }), updatedAt: new Date().toISOString() }
      }) } })
      if (ok) { setManage(null); setNotice("保存成功") }
    } catch (e) { setNotice(e.message) }
    finally { lock.current = false; setBusy(false) }
  }
  function openSource(t) {
    try {
      const key = "xianma-canvas-projects-v1", saved = JSON.parse(localStorage.getItem(key)) || { projects: [...initialCanvasProjects], folders: [...initialCanvasFolders] }
      if (!saved.projects.some(p => p.id === t.projectId)) {
        if (t.projectId !== "wf-example") { setNotice("来源画布已不可用，请联系作者确认"); return }
        saved.projects.push({ id: t.projectId, name: t.name, cover: t.cover, status: "草稿", createdAt: "2026-10-13", updatedAt: "2026-10-13" })
        localStorage.setItem(key, JSON.stringify(saved))
        // Seed only the explicit demo source; never overwrite an existing canvas.
        if (!localStorage.getItem(`xianma-beef-prototype-v3:${t.projectId}`)) localStorage.setItem(`xianma-beef-prototype-v3:${t.projectId}`, JSON.stringify(workflowDemoGraph))
      }
      location.href = `/ai-canvas?project=${encodeURIComponent(t.projectId)}`
    } catch { setNotice("来源画布读取失败，请重试") }
  }
  async function copyLink(t) { try { await navigator.clipboard.writeText(`${location.origin}/ai-canvas?view=templates&template=${t.id}`); setNotice("使用链接已复制，访问仍需部门权限") } catch { setNotice("复制失败，请进入模板后复制地址栏链接") } }
  useEffect(() => {
    const tabLabel = { available: "可用模板", published: "我的发布", tasks: "我的任务" }[tab] || "可用模板"
    window.dispatchEvent(new CustomEvent("canvas-breadcrumbs", { detail: [
      { label: "首页", href: "/home" }, { label: "无限画布", href: "/ai-canvas" },
      { label: "工作流模板", href: "/ai-canvas?view=templates" },
      { label: tabLabel, href: `/ai-canvas?view=templates&tab=${tab}` },
      ...(params.task ? [{ label: task?.templateName || "任务详情" }] : params.template ? [{ label: template?.name || "模板详情" }] : []),
    ] }))
  }, [tab, params.task, params.template, task?.templateName, template?.name])
  const visible = store.templates.filter(t => tab === "published" ? canManage(t, user) : t.status === "published" && canUse(t, user, organizationTree)).filter(t => t.name.includes(query) && (!scene || t.scenes.includes(scene)))
  return <div className={styles.scope}>
    <div className={styles.toolbar}><div className={styles.actions}><span className={styles.prototype}>本地原型 · 示例积分与结果</span><label className={styles.role}>演示身份<select aria-label="演示身份" disabled={busy} value={store.userId} onChange={e => { setManage(null); setOrgs([]); mutate(s => ({ ...s, userId: e.target.value })); setNotice("") }}>{workflowUsers.map(u => <option key={u.name} value={u.id}>{u.name}</option>)}</select></label></div></div>
    <div className={styles.hero}><div className={styles.heroIcon}><Workflow size={27} /></div><div><h2>工作流模板</h2><p>将画布中调好的创作流程封装为模板，就能分享给有权限的同事重复使用。使用者选择模板、上传图片并填写内容，即可生成对应结果；适合商品换款、同类素材制作等需要反复复用流程的场景。</p></div><a className={styles.heroAction} href="/api/workflow-prd" download><Download size={15} />导出 PRD</a></div>
    <nav className={styles.tabs} aria-label="工作流模板导航">{[["available", "可用模板"], ["published", "我的发布"], ["tasks", "我的任务"]].map(([id, name]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { navigate({ tab: id }); setNotice(""); setScenario("normal") }}>{name}</button>)}</nav>
    {!params.task && <details className={styles.demoOptions}><summary>原型验收工具（非正式页面需求）</summary><p>仅用于演示正常与异常状态，不纳入正式产品页面。</p>{tab === "tasks" && !params.task ? <label>记录状态<select aria-label="记录状态" value={recordMode} onChange={e => setRecordMode(e.target.value)}><option value="records">有记录</option><option value="empty">无记录</option></select></label> : <label>模拟场景<select aria-label="模拟场景" value={scenario} onChange={e => setScenario(e.target.value)}>{scenarioOptions.filter(([id]) => params.template ? ["normal", "insufficient", "quote-failure", "run-failure"].includes(id) : tab === "published" ? ["normal", "save-failure", "list-failure"].includes(id) : ["normal", "list-failure"].includes(id)).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>}{scenarioHints[scenario] && tab !== "tasks" && <p role="status" className={styles.notice}>{scenarioHints[scenario]}</p>}</details>}
    {notice && <div role="status" className={styles.notice}>{notice}<button aria-label="关闭提示" onClick={() => setNotice("")}>关闭</button></div>}
    {!user.id ? <Empty title="请先登录" description="登录后可查看模板、发布记录与本人任务，当前访问位置将保留。"><Button onClick={() => mutate(s => ({ ...s, userId: "wf-member" }))}>去登录</Button></Empty> : params.task ? task ? <TaskDetail task={task} now={now} onBack={() => navigate({ tab: "tasks" })} /> : <Empty title="无法查看此任务" description="仅能查看本人任务，请确认当前登录身份。" /> : params.template ? template ? <TemplateRun key={`${template.id}:${user.id}`} template={template} user={user} scenario={scenario} now={now} sourceTask={[...ownTasks, ...demoTasks].find(t => t.id === params.fromTask && t.templateId === template.id)} onTask={id => navigate({ tab: "tasks", task: id })} /> : <Empty title="模板不存在" description="请返回模板列表选择可用模板。" /> : scenario === "list-failure" && tab !== "tasks" ? <Empty title="列表加载失败" description="请重试获取模板和任务记录。"><Button onClick={() => setScenario("normal")}>重试</Button></Empty> : tab === "tasks" ? <>
      <div className={styles.sectionHead}><div><h3>我的运行记录</h3><p className={styles.muted}>已提交任务独立保留，不受模板更新、下架或撤权影响。</p></div><Clock3 size={20} /></div>
      {!listedTasks.length ? <Empty title="还没有运行任务" description="从可用模板开始，运行后的进度和结果会保留在这里。"><Button onClick={() => navigate({})}>浏览模板</Button></Empty> : <div className={styles.taskList}>{listedTasks.slice().reverse().map(t => <button key={t.id} onClick={() => navigate({ tab: "tasks", task: t.id })}><span><strong>{t.templateName}</strong><small>{formatTime(t.startedAt)} · V{t.version}</small></span><span className={styles.badge}>{labels[taskState(t, now)]}</span><span>预计 {t.estimated} 积分</span><ArrowRight size={16} /></button>)}</div>}
    </> : <>
      <div className={styles.filters}><label className={styles.search}><Search size={17} /><input aria-label="搜索模板名称" placeholder="搜索模板名称" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="筛选使用场景" value={scene} onChange={e => setScene(e.target.value)}><option value="">全部场景</option>{workflowScenes.map(s => <option key={s}>{s}</option>)}</select><span className={styles.muted}>{visible.length} 个模板</span>{tab === "published" && <a href="/ai-canvas" className={styles.back}>进入画布封装 <ArrowRight size={15} /></a>}</div>
      {!visible.length ? <Empty title={query || scene ? "没有匹配的模板" : tab === "published" ? "还没有发布模板" : "暂无可用模板"} description={query || scene ? "试试其他名称或场景。" : tab === "published" ? "进入自己的画布，点击顶部“封装为模板”。" : "这里只显示当前身份有权使用的已发布模板。"} /> : <div className={styles.cardGrid}>{visible.map(t => <article className={styles.card} key={t.id}><button className={styles.cardCover} onClick={() => navigate({ template: t.id, tab })}><SafeImage src={t.cover} alt={t.name} /><span className={styles.badge}>{t.status === "published" ? "已发布" : "已下架"}</span></button><div className={styles.cardBody}><h3>{t.name}</h3><p>{t.description}</p><div className={styles.chips}>{t.scenes.map(s => <span key={s}>{s}</span>)}</div><small>{t.authorName} · V{t.version} · {formatTime(t.updatedAt)}</small><div className={styles.cardActions}>{tab === "published" ? <><Button variant="outline" onClick={() => navigate({ template: t.id, tab })}>使用预览</Button><Button variant="outline" onClick={() => openSource(t)}>编辑 / 更新发布</Button><Button variant="outline" onClick={() => openManage(t, "org")}>可见组织</Button><Button variant="outline" onClick={() => copyLink(t)}><Copy size={14} />链接</Button><Button variant="outline" onClick={() => openManage(t, t.status === "published" ? "unpublish" : "publish")}>{t.status === "published" ? "下架" : "重新上架"}</Button></> : <Button onClick={() => navigate({ template: t.id, tab })}>使用模板<ArrowRight size={15} /></Button>}</div></div></article>)}</div>}
    </>}
    {manage && manage.userId === user.id && canManage(manage.template, user) && <WorkbenchPickerDialog title={manage.action === "org" ? "调整可见组织" : manage.action === "publish" ? "重新上架模板" : "下架模板"} onClose={() => { if (!busy) setManage(null) }} footer={<><Button variant="outline" disabled={busy} onClick={() => setManage(null)}>取消</Button><Button disabled={busy} onClick={confirmManage}>{busy ? "保存中…" : "确认"}</Button></>}><div className={styles.scope}><h3>{manage.template.name}</h3>{manage.action === "org" ? <OrganizationScopeSelector organizations={organizationTree} organizationLabel={companyOrganizationName} value={orgs} onChange={setOrgs} allowedScopeIds={null} /> : <p>{manage.action === "publish" ? `检查通过后恢复最后成功发布的 V${manage.template.version}，原链接继续有效，不自动采用原画布的新修改。` : "下架后，同事将无法启动新任务；已提交任务继续执行，历史结果保留。"}</p>}{notice && <p role="alert" className={styles.notice}>{notice}</p>}</div></WorkbenchPickerDialog>}
  </div>
}

function Empty({ title, description, children }) { return <div className={styles.empty}><Workflow size={32} /><h3>{title}</h3><p>{description}</p>{children}</div> }

function TemplateRun({ template, user, scenario, now, sourceTask, onTask }) {
  const store = useWorkflowStore()
  const [contract, setContract] = useState(() => structuredClone(template))
  const [values, setValues] = useState(() => Object.fromEntries(template.inputs.filter(i => i.open && sourceTask?.snapshot.inputs.some(old => old.open && old.nodeId === i.nodeId && old.type === i.type)).map(i => [i.nodeId, sourceTask.values[i.nodeId] || ""]))), [errors, setErrors] = useState(""), [busy, setBusy] = useState(false), [quoteReady, setQuoteReady] = useState(false), [previewIndex, setPreviewIndex] = useState(null), [expanded, setExpanded] = useState(null)
  const [showExample, setShowExample] = useState(false)
  const inputImages = contract.inputs.filter(i => i.open && i.type === "image" && values[i.nodeId]).map(i => ({ id: i.nodeId, src: values[i.nodeId], name: i.label }))
  const closePreview = useCallback(() => setPreviewIndex(null), [])
  const request = useRef(null), lock = useRef(false)
  const allowed = canUse(template, user, organizationTree)
  useEffect(() => {
    if (scenario !== "quote-failure") {
      const timer = setTimeout(() => setQuoteReady(false), 0)
      return () => clearTimeout(timer)
    }
  }, [scenario])
  const quote = scenario === "quote-failure" && !quoteReady ? null : contract.demoQuote
  const balance = scenario === "insufficient" ? 0 : user.balance
  const latestTask = store.tasks.filter(t => t.templateId === template.id && t.ownerId === user.id).at(-1)
  async function upload(input, event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setErrors("只支持图片输入"); return }
    const reader = new FileReader(); reader.onload = () => { setValues(v => ({ ...v, [input.nodeId]: reader.result })); setErrors("") }; reader.onerror = () => setErrors("图片读取失败，请重新选择"); reader.readAsDataURL(file)
  }
  async function submit() {
    if (lock.current) return
    lock.current = true; setBusy(true); setErrors("")
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      request.current ||= crypto.randomUUID()
      let accepted
      saveWorkflows(s => {
        assertSubmissionIdentity(s.userId, user.id)
        const current = s.templates.find(t => t.id === template.id)
        if (!current) throw new Error("模板不存在")
        accepted = acceptTask({ template: current, user: { ...user, balance }, tree: organizationTree, version: contract.version, values, requestId: request.current, tasks: s.tasks, quote, now: Date.now(), outcome: scenario === "run-failure" ? "failed" : "succeeded" })
        return { ...s, tasks: s.tasks.some(t => t.id === accepted.id) ? s.tasks : [...s.tasks, accepted] }
      })
      request.current = null; onTask(accepted.id)
    } catch (e) {
      setErrors(e.message)
      if (template.version !== contract.version) {
        setValues(v => Object.fromEntries(template.inputs.filter(i => i.open && contract.inputs.some(old => old.open && old.nodeId === i.nodeId && old.type === i.type)).map(i => [i.nodeId, v[i.nodeId] || ""])))
        setContract(structuredClone(template))
      }
    } finally { lock.current = false; setBusy(false) }
  }
  if (!user.id) return <Empty title="请先登录" description="登录后继续访问此模板，目标链接将保留。"><Button onClick={() => saveWorkflows(s => ({ ...s, userId: "wf-member" }))}>去登录</Button></Empty>
  if (!allowed) return <Empty title="你暂无此模板的使用权限" description="请联系模板作者确认可见部门。" />
  if (template.status !== "published") return <Empty title="模板已下架，暂时无法使用" description="已提交的任务仍可从“我的任务”查看。"><Button onClick={() => navigate({ tab: "tasks" })}>我的任务</Button></Empty>
  if (showExample && contract.exampleCase) return <ExampleCase example={contract.exampleCase} name={contract.name} onBack={() => setShowExample(false)} />
  return <>
    <div className={styles.templateHead}><div><h2>{contract.name}</h2><p>{contract.description}</p><small>{contract.scenes.join(" / ")} · {contract.authorName} · V{contract.version}</small></div>{contract.exampleCase && <Button variant="outline" onClick={() => setShowExample(true)}>查看示例</Button>}</div>
    {contract.version !== template.version && <div className={styles.notice}>模板已更新，请核对最新填写要求后重新提交。兼容的输入将保留。</div>}
    <div className={styles.runGrid}><section className={styles.panel}><WorkbenchModule title="填写参数" hint="仅填写开放内容">
      <div className={styles.stack}>{contract.inputs.filter(i => i.open).map(input => <div key={input.nodeId} className={styles.inputField}><div className={styles.row}><strong>{input.label} <span className={styles.required}>{input.required ? "必填" : "选填"}</span></strong>{input.type === "text" && <button onClick={() => setExpanded(input)}>放大编辑</button>}</div>{input.type === "image" ? <div className={styles.uploadArea}>{values[input.nodeId] ? <><button className={styles.imageButton} onClick={() => setPreviewIndex(inputImages.findIndex(i => i.id === input.nodeId))}><SafeImage src={values[input.nodeId]} alt={input.label} /></button><div className={styles.actions}><label className={styles.upload}>更换图片<input aria-label={`更换${input.label}`} type="file" accept="image/*" onChange={e => upload(input, e)} /></label><Button variant="outline" onClick={() => setValues(v => ({ ...v, [input.nodeId]: "" }))}>清除</Button></div></> : <label className={styles.upload}><ImageIcon size={26} /><span>点击上传{input.label}</span><input aria-label={`上传${input.label}`} type="file" accept="image/*" onChange={e => upload(input, e)} /></label>}</div> : <label><span className={styles.srOnly}>{input.label}</span><textarea rows={5} value={values[input.nodeId] || ""} placeholder={input.help || "填写内容"} onChange={e => setValues(v => ({ ...v, [input.nodeId]: e.target.value }))} /></label>}{input.help && <p className={styles.muted}>{input.help}</p>}</div>)}</div>
    </WorkbenchModule><div className={styles.cost}><div className={styles.row}><strong>查看费用（积分）</strong><span>个人余额 {balance} 积分</span></div>{quote === null ? <p role="alert">费用获取失败 <button onClick={() => setQuoteReady(true)}>重试</button></p> : <p>预计 <strong>{quote}</strong> 积分 <small>由当前使用者承担</small></p>}<p className={styles.muted}>扣费及失败结算沿用平台规则，以任务实际流水为准。</p></div>{errors && <p role="alert" className={styles.notice}>{errors}</p>}<Button className="w-full" disabled={busy || quote === null || balance < (quote || 0)} onClick={submit}><Play size={16} />{busy ? "正在提交…" : balance < (quote || 0) ? "积分不足，请补充积分或返回" : "开始运行"}</Button></section>
    <section className={styles.panel}><div className={styles.sectionHead}><h3>运行状态与结果</h3><span className={styles.badge}>{latestTask ? "本人最近任务" : "尚未运行"}</span></div>{latestTask ? <><p>{labels[taskState(latestTask, now)]} · V{latestTask.version}</p><Button variant="outline" onClick={() => onTask(latestTask.id)}>查看任务详情</Button>{["failed", "cancelled"].includes(taskState(latestTask, now)) ? <Empty title={taskState(latestTask, now) === "failed" ? "本次运行失败" : "本次任务已取消"} description="本任务没有交付结果，可查看任务详情及已保存的输入。" /> : <Outputs snapshot={latestTask.snapshot} visible={taskState(latestTask, now) === "succeeded"} />}</> : <Empty title="还没有运行结果" description="填写左侧内容并运行，结果将在这里展示。" />}</section></div>
    {previewIndex !== null && inputImages[previewIndex] && <ImagePreviewModal images={inputImages} index={previewIndex} setIndex={setPreviewIndex} getSrc={previewSrc} getName={previewName} featureName="输入图片" onClose={closePreview} />}
    {expanded && <WorkbenchPickerDialog title={`编辑${expanded.label}`} onClose={() => setExpanded(null)} footer={<Button onClick={() => setExpanded(null)}>完成</Button>}><label className={styles.scope}>{expanded.label}<textarea className={styles.largeText} value={values[expanded.nodeId] || ""} onChange={e => setValues(v => ({ ...v, [expanded.nodeId]: e.target.value }))} /></label></WorkbenchPickerDialog>}
    {scenario === "quote-failure" && quoteReady && <p className={styles.muted}>费用已重新获取。</p>}
  </>
}

const previewSrc = image => image.src
const previewName = image => image.name

function Outputs({ snapshot, visible, example = false }) {
  const [imageIndex, setImageIndex] = useState(null), [copied, setCopied] = useState("")
  const closePreview = useCallback(() => setImageIndex(null), [])
  const images = snapshot.outputs.filter(o => o.type === "image").map(o => ({ id: o.nodeId, name: o.label, src: snapshot.graph.nodes.find(n => n.id === o.nodeId)?.result })).filter(i => i.src)
  if (!visible) return <Empty title="结果准备中" description="任务完成后，交付结果将显示在这里。" />
  return <div className={styles.outputList}>{snapshot.outputs.map(output => {
    const node = snapshot.graph.nodes.find(n => n.id === output.nodeId)
    return <article className={styles.output} key={output.nodeId}><div className={styles.row}><h4>{output.label}</h4><span className={styles.badge}>{example ? "示范案例" : "本人结果"} · {output.type}</span></div>{output.type === "image" ? node?.result ? <><button className={styles.imageButton} onClick={() => setImageIndex(images.findIndex(i => i.id === output.nodeId))}><SafeImage src={node.result} alt={output.label} /></button><a className={styles.download} href={node.result} download={`${output.label}.jpg`}>下载图片</a></> : <p>暂无可预览图片，请返回画布准备样品。</p> : output.type === "text" ? <><p className={styles.resultText}>{outputText(node) || "暂无文本结果"}</p><button onClick={async () => { try { await navigator.clipboard.writeText(outputText(node)); setCopied(output.nodeId) } catch { setCopied("error") } }}>{copied === output.nodeId ? <><Check size={14} />已复制</> : <><FileText size={14} />复制文本</>}</button>{copied === "error" && <p role="alert">复制失败，请手动选择文本复制。</p>}</> : node?.result && /\.(mp4|webm)(\?|$)/i.test(node.result) ? <><video controls src={node.result} /><a href={node.result} download>下载视频</a></> : <p>暂无可播放的视频样品。</p>}</article>
  })}{imageIndex !== null && images[imageIndex] && <ImagePreviewModal images={images} index={imageIndex} setIndex={setImageIndex} getSrc={previewSrc} getName={previewName} featureName="结果图片" onClose={closePreview} />}</div>
}

function TaskDetail({ task, now }) {
  const [previewIndex, setPreviewIndex] = useState(null)
  const closePreview = useCallback(() => setPreviewIndex(null), [])
  const images = task.snapshot.inputs.filter(i => i.open && i.type === "image" && task.values[i.nodeId]).map(i => ({ id: i.nodeId, name: i.label, src: task.values[i.nodeId] }))
  const state = taskState(task, now)
  return <><div className={styles.templateHead}><div><h2>{task.templateName}</h2><p>{formatTime(task.startedAt)} · 发布版本 V{task.version}</p></div><span className={styles.badge}>{labels[state]}</span></div><div className={styles.runGrid}><section className={styles.panel}><h3>本次输入</h3>{task.snapshot.inputs.filter(i => i.open).map(input => <div key={input.nodeId} className={styles.fieldCard}><strong>{input.label}</strong>{input.type === "image" && task.values[input.nodeId] ? <button className={styles.imageButton} onClick={() => setPreviewIndex(images.findIndex(i => i.id === input.nodeId))}><SafeImage className={styles.taskInput} src={task.values[input.nodeId]} alt={input.label} /></button> : <p className={styles.resultText}>{task.values[input.nodeId] || "未填写"}</p>}</div>)}<div className={styles.cost}><h4>积分消耗</h4><p>预计 {task.estimated} 积分</p><p>{task.settled == null ? "实际结算：待平台流水确认" : `示例实际消耗：${task.settled} 积分`}</p></div></section><section className={styles.panel}><h3>交付结果</h3>{state === "failed" && <div role="alert" className={styles.notice}>生成步骤执行失败，请检查素材和填写内容。已保留本次输入，本任务暂无交付结果。请返回模板检查后重新提交。<Button variant="outline" onClick={() => navigate({ template: task.templateId, fromTask: task.id })}>返回模板修改</Button></div>}{state === "cancelled" && <p>任务已取消，历史输入保留。</p>}{["queued", "running", "succeeded"].includes(state) && <Outputs snapshot={task.snapshot} visible={state === "succeeded"} />}</section></div>{previewIndex !== null && images[previewIndex] && <ImagePreviewModal images={images} index={previewIndex} setIndex={setPreviewIndex} getSrc={previewSrc} getName={previewName} featureName="任务输入图片" onClose={closePreview} />}</>
}


function ExampleCase({ example, name, onBack }) {
  const [index, setIndex] = useState(null)
  const closePreview = useCallback(() => setIndex(null), [])
  const images = example.inputs.filter(i => i.type === "image" && example.values[i.nodeId]).map(i => ({ id: i.nodeId, src: example.values[i.nodeId], name: i.label }))
  return <section aria-label="示范案例" className={styles.stack}>
    <div className={styles.templateHead}><div><h2>示范案例 · {name}</h2><p>V{example.version} · 只读查看，不消耗积分，不会填入你的任务</p></div><Button variant="outline" onClick={onBack}>返回使用页</Button></div>
    <div className={styles.runGrid}><section className={styles.panel}><h3>案例输入</h3>{example.inputs.map(input => <article className={styles.fieldCard} key={input.nodeId}><h4>{input.label}</h4>{input.type === "image" ? <button className={styles.imageButton} onClick={() => setIndex(images.findIndex(i => i.id === input.nodeId))}><SafeImage src={example.values[input.nodeId]} alt={input.label} /></button> : <p className={styles.resultText}>{example.values[input.nodeId]}</p>}{input.help && <p className={styles.muted}>{input.help}</p>}</article>)}</section><section className={styles.panel}><h3>案例最终输出</h3><Outputs snapshot={example} visible example /></section></div>
    {index !== null && images[index] && <ImagePreviewModal images={images} index={index} setIndex={setIndex} getSrc={previewSrc} getName={previewName} featureName="案例输入图片" onClose={closePreview} />}
  </section>
}
