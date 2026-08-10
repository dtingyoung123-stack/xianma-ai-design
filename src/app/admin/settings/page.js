"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  Bot,
  Check,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Wrench,
  X,
} from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { adminModels, initialSystemPrompts } from "@/data/demo/admin"

const emptyAnnouncement = { content: "", maintenanceAt: "" }
const defaultMaintenance = { enabled: false, message: "系统维护中，请稍后再试。", scheduledAt: "" }

export default function SettingsPage() {
  const [announcement, setAnnouncement] = useState(emptyAnnouncement)
  const [publishedAnnouncement, setPublishedAnnouncement] = useState(null)
  const [maintenance, setMaintenance] = useState(defaultMaintenance)
  const [defaultModel, setDefaultModel] = useState("")
  const [prompts, setPrompts] = useState(initialSystemPrompts)
  const [promptDraft, setPromptDraft] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!promptDraft && !deleteTarget) return undefined
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return
      setPromptDraft(null)
      setDeleteTarget(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [deleteTarget, promptDraft])

  function refreshSettings() {
    setAnnouncement(emptyAnnouncement)
    setPublishedAnnouncement(null)
    setMaintenance(defaultMaintenance)
    setDefaultModel("")
    setPrompts(initialSystemPrompts)
    setMessage("系统设置已重新载入")
  }

  function publishAnnouncement() {
    if (!announcement.content.trim()) return
    setPublishedAnnouncement({ ...announcement, publishedAt: new Date().toISOString() })
    setMessage("全站公告已发布")
  }

  function clearAnnouncement() {
    setPublishedAnnouncement(null)
    setAnnouncement(emptyAnnouncement)
    setMessage("全站公告已清空")
  }

  function saveMaintenance() {
    setMessage(maintenance.enabled ? "停站设置已保存，普通用户将看到维护页面" : "停站设置已保存，站点保持开放")
  }

  function saveDefaultModel() {
    if (!defaultModel) return
    setMessage(`默认大语言模型已设置为 ${adminModels.find((model) => model.id === defaultModel)?.name}`)
  }

  function openNewPrompt() {
    setPromptDraft({ id: null, name: "", scope: "全平台", enabled: true, content: "" })
  }

  function savePrompt() {
    if (!promptDraft.name.trim() || !promptDraft.content.trim()) {
      setMessage("请填写提示词名称和内容")
      return
    }
    if (promptDraft.id) {
      setPrompts((current) => current.map((prompt) => prompt.id === promptDraft.id ? promptDraft : prompt))
      setMessage("系统提示词已更新")
    } else {
      setPrompts((current) => [...current, { ...promptDraft, id: `prompt-${Date.now()}` }])
      setMessage("系统提示词已新增")
    }
    setPromptDraft(null)
  }

  function deletePrompt() {
    setPrompts((current) => current.filter((prompt) => prompt.id !== deleteTarget.id))
    setDeleteTarget(null)
    setMessage("系统提示词已删除")
  }

  function togglePrompt(promptId) {
    setPrompts((current) => current.map((prompt) => prompt.id === promptId ? { ...prompt, enabled: !prompt.enabled } : prompt))
    setMessage("系统提示词状态已更新")
  }

  return (
    <PageShell
      pathname="/admin/settings"
      description="维护全站公告、停站状态、默认大语言模型和系统提示词"
      actions={<Button variant="outline" size="lg" className="gap-2" onClick={refreshSettings}><RefreshCw size={16} />刷新</Button>}
    >
      {message && <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes("请填写") ? "bg-[var(--warning-bg)] text-[var(--warning)]" : "bg-[var(--success-bg)] text-[var(--success)]"}`} role="status">{message}</div>}

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsPanel icon={Bell} eyebrow="全站公告" title="发公告" status={publishedAnnouncement ? "已发布" : "暂无公告"}>
          {publishedAnnouncement && (
            <div className="mb-4 rounded-lg bg-[var(--brand-primary-soft)] px-4 py-3 text-sm text-[var(--text-body)]">
              <strong className="block text-[var(--brand-primary)]">当前公告</strong>
              <p className="mt-1">{publishedAnnouncement.content}</p>
              {publishedAnnouncement.maintenanceAt && <span className="mt-1 block text-xs text-[var(--text-secondary)]">维护时间：{publishedAnnouncement.maintenanceAt}</span>}
            </div>
          )}
          <Field label="公告内容">
            <textarea value={announcement.content} onChange={(event) => setAnnouncement((current) => ({ ...current, content: event.target.value }))} placeholder="将在18:20进行系统维护，请提前安排工作。" rows={4} className="w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
          </Field>
          <Field label="维护时间">
            <input type="datetime-local" value={announcement.maintenanceAt} onChange={(event) => setAnnouncement((current) => ({ ...current, maintenanceAt: event.target.value }))} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
          </Field>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="lg" onClick={clearAnnouncement} disabled={!publishedAnnouncement && !announcement.content}>清空公告</Button>
            <Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={publishAnnouncement} disabled={!announcement.content.trim()}><Send size={16} />发送公告</Button>
          </div>
        </SettingsPanel>

        <SettingsPanel icon={Wrench} eyebrow="停站维护" title="关站功能" status={maintenance.enabled ? "维护中" : "站点开放中"}>
          <button type="button" role="switch" aria-checked={maintenance.enabled} onClick={() => setMaintenance((current) => ({ ...current, enabled: !current.enabled }))} className="mb-4 flex w-full items-center justify-between rounded-lg bg-[var(--gray-50)] px-4 py-3 text-left">
            <span><strong className="block text-sm text-[var(--text-title)]">启用停站页面</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">普通用户进入平台时显示维护提示。</span></span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${maintenance.enabled ? "bg-[var(--brand-primary)]" : "bg-[var(--gray-300)]"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${maintenance.enabled ? "translate-x-6" : "translate-x-1"}`} /></span>
          </button>
          <Field label="停站提示">
            <textarea value={maintenance.message} onChange={(event) => setMaintenance((current) => ({ ...current, message: event.target.value }))} rows={3} className="w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
          </Field>
          <Field label="计划维护时间">
            <input type="datetime-local" value={maintenance.scheduledAt} onChange={(event) => setMaintenance((current) => ({ ...current, scheduledAt: event.target.value }))} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
          </Field>
          <div className="mt-3 rounded-lg bg-[var(--warning-bg)] px-4 py-3 text-xs leading-5 text-[var(--text-body)]">
            启用后普通用户会看到停站页，系统管理员仍可进入后台处理配置。
          </div>
          <div className="mt-4 flex justify-end"><Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={saveMaintenance}><Save size={16} />保存停站设置</Button></div>
        </SettingsPanel>
      </div>

      <section className="mt-6 border-y py-5" style={{ borderColor: "var(--border-base)" }}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><Bot size={19} /></span>
          <div><p className="text-xs font-semibold text-[var(--brand-primary)]">AI设置</p><h2 className="text-base font-semibold text-[var(--text-title)]">默认大语言模型</h2></div>
          <span className="ml-auto rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">{defaultModel ? "已配置" : "未配置"}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="模型" className="min-w-0 flex-1">
            <select value={defaultModel} onChange={(event) => setDefaultModel(event.target.value)} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }}>
              <option value="">请选择默认模型</option>
              {adminModels.filter((model) => model.enabled).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>
          </Field>
          <Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={saveDefaultModel} disabled={!defaultModel}><Save size={16} />保存默认模型</Button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-base)" }}>
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><FileText size={19} /></span><div><p className="text-xs font-semibold text-[var(--brand-primary)]">提示词合集</p><h2 className="text-base font-semibold text-[var(--text-title)]">系统提示词 <span className="text-sm font-normal text-[var(--text-secondary)]">{prompts.length} 条</span></h2></div></div>
          <Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={openNewPrompt}><Plus size={16} />新增提示词</Button>
        </div>
        {prompts.map((prompt) => (
          <article key={prompt.id} className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center" style={{ borderColor: "var(--border-light)" }}>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--text-title)]">{prompt.name}</strong><span className="rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">{prompt.scope}</span><span className={`rounded-md px-2 py-1 text-xs ${prompt.enabled ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}>{prompt.enabled ? "已启用" : "已停用"}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{prompt.content}</p></div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => togglePrompt(prompt.id)}>{prompt.enabled ? "停用" : "启用"}</Button>
              <Button variant="outline" size="icon" aria-label={`编辑${prompt.name}`} onClick={() => setPromptDraft({ ...prompt })}><Pencil size={15} /></Button>
              <Button variant="outline" size="icon" aria-label={`删除${prompt.name}`} className="text-[var(--danger)]" onClick={() => setDeleteTarget(prompt)}><Trash2 size={15} /></Button>
            </div>
          </article>
        ))}
        {!prompts.length && <div className="flex min-h-52 flex-col items-center justify-center gap-2 px-6 text-center"><FileText size={32} className="text-[var(--text-disabled)]" /><p className="text-sm text-[var(--text-secondary)]">暂无系统提示词</p><Button variant="outline" size="lg" onClick={openNewPrompt}>新增提示词</Button></div>}
      </section>

      {promptDraft && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay-scrim)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPromptDraft(null)}>
          <section className="flex max-h-[calc(100vh-32px)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="prompt-dialog-title">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "var(--border-base)" }}><div><h2 id="prompt-dialog-title" className="text-lg font-semibold text-[var(--text-title)]">{promptDraft.id ? "编辑系统提示词" : "新增系统提示词"}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">系统提示词会影响对应范围内的AI输出。</p></div><button type="button" onClick={() => setPromptDraft(null)} aria-label="关闭提示词编辑" className="flex size-8 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"><X size={18} /></button></div>
            <div className="space-y-4 overflow-y-auto p-5">
              <Field label="名称"><input value={promptDraft.name} onChange={(event) => setPromptDraft((current) => ({ ...current, name: event.target.value }))} placeholder="请输入提示词名称" className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></Field>
              <Field label="适用范围"><select value={promptDraft.scope} onChange={(event) => setPromptDraft((current) => ({ ...current, scope: event.target.value }))} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }}><option>全平台</option><option>商品相关功能</option><option>图片编辑功能</option><option>买家秀相关功能</option></select></Field>
              <Field label="提示词内容"><textarea value={promptDraft.content} onChange={(event) => setPromptDraft((current) => ({ ...current, content: event.target.value }))} rows={7} placeholder="请输入系统提示词" className="w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 outline-none" style={{ borderColor: "var(--border-base)" }} /></Field>
              <label className="flex items-center gap-2 text-sm text-[var(--text-body)]"><input type="checkbox" checked={promptDraft.enabled} onChange={(event) => setPromptDraft((current) => ({ ...current, enabled: event.target.checked }))} className="size-4 accent-[var(--brand-primary)]" />保存后立即启用</label>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4" style={{ borderColor: "var(--border-base)" }}><Button variant="outline" size="lg" onClick={() => setPromptDraft(null)}>取消</Button><Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={savePrompt}><Check size={16} />保存提示词</Button></div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay-scrim)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}>
          <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-prompt-title">
            <h2 id="delete-prompt-title" className="text-lg font-semibold text-[var(--text-title)]">删除系统提示词？</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">删除“{deleteTarget.name}”后，该规则将不再应用，当前原型中无法恢复。</p>
            <div className="mt-5 flex justify-end gap-3"><Button variant="outline" size="lg" onClick={() => setDeleteTarget(null)}>取消</Button><Button variant="destructive" size="lg" className="gap-2" onClick={deletePrompt}><Trash2 size={16} />确认删除</Button></div>
          </section>
        </div>
      )}
    </PageShell>
  )
}

function SettingsPanel({ icon: Icon, eyebrow, title, status, children }) {
  return (
    <section className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--border-base)" }}>
      <div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><Icon size={19} /></span><div><p className="text-xs font-semibold text-[var(--brand-primary)]">{eyebrow}</p><h2 className="text-base font-semibold text-[var(--text-title)]">{title}</h2></div><span className="ml-auto rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">{status}</span></div>
      {children}
    </section>
  )
}

function Field({ label, className = "", children }) {
  return <label className={`mb-4 block ${className}`}><span className="mb-1.5 block text-xs font-medium text-[var(--text-body)]">{label}</span>{children}</label>
}
