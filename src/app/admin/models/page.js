"use client"

import { useMemo, useState } from "react"
import { RefreshCw, Save } from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { adminModels, moduleModelRules } from "@/data/demo/admin"

function cloneModels() {
  return adminModels.map((model) => ({ ...model }))
}

function cloneRules() {
  return moduleModelRules.map((rule) => ({ ...rule, allowedModels: [...rule.allowedModels] }))
}

export default function ModelsPage() {
  const [models, setModels] = useState(cloneModels)
  const [rules, setRules] = useState(cloneRules)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const enabledCount = models.filter((model) => model.enabled).length
  const modelMap = useMemo(() => Object.fromEntries(models.map((model) => [model.id, model])), [models])

  function resetConfiguration() {
    setModels(cloneModels())
    setRules(cloneRules())
    setMessage("已重新载入当前配置")
  }

  function toggleModel(modelId) {
    const nextEnabled = !modelMap[modelId].enabled
    const enabledIds = models.filter((model) => model.id !== modelId ? model.enabled : nextEnabled).map((model) => model.id)
    if (!nextEnabled && enabledIds.length === 0) {
      setMessage("至少需要保留一个全局模型")
      return
    }
    setModels((current) => current.map((model) => model.id === modelId ? { ...model, enabled: nextEnabled } : model))
    if (!nextEnabled) {
      setRules((current) => current.map((rule) => {
        if (rule.defaultModel !== modelId) return rule
        const fallback = rule.allowedModels.find((id) => id !== modelId && enabledIds.includes(id))
        return fallback ? { ...rule, defaultModel: fallback } : rule
      }))
    }
    setMessage("")
  }

  function updateLimit(modelId, field, value) {
    const number = Math.max(1, Number.parseInt(value || "1", 10))
    setModels((current) => current.map((model) => model.id === modelId ? { ...model, [field]: number } : model))
    setMessage("")
  }

  function setDefaultModel(moduleId, modelId) {
    setRules((current) => current.map((rule) => rule.id === moduleId ? { ...rule, defaultModel: modelId } : rule))
    setMessage("")
  }

  function toggleAllowedModel(moduleId, modelId) {
    setRules((current) => current.map((rule) => {
      if (rule.id !== moduleId) return rule
      const selected = rule.allowedModels.includes(modelId)
      const allowedModels = selected
        ? rule.allowedModels.filter((id) => id !== modelId)
        : [...rule.allowedModels, modelId]
      if (allowedModels.length === 0) {
        setMessage("每个功能至少需要保留一个可选模型")
        return rule
      }
      const defaultModel = allowedModels.includes(rule.defaultModel)
        ? rule.defaultModel
        : allowedModels.find((id) => modelMap[id]?.enabled) || allowedModels[0]
      setMessage("")
      return { ...rule, allowedModels, defaultModel }
    }))
  }

  function saveConfiguration() {
    setSaving(true)
    setMessage("")
    window.setTimeout(() => {
      setSaving(false)
      setMessage("模型配置已保存")
    }, 650)
  }

  return (
    <PageShell
      pathname="/admin/models"
      description="配置全局模型限制，以及各生图功能的默认模型和可选模型"
      actions={(
        <>
          <Button variant="outline" size="lg" className="gap-2" onClick={resetConfiguration}><RefreshCw size={16} />重新加载</Button>
          <Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={saveConfiguration} disabled={saving}><Save size={16} />{saving ? "保存中" : "保存配置"}</Button>
        </>
      )}
    >
      {message && <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes("至少") ? "bg-[var(--warning-bg)] text-[var(--warning)]" : "bg-[var(--success-bg)] text-[var(--success)]"}`} role="status">{message}</div>}

      <section className="mb-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-base font-semibold text-[var(--text-title)]">全局模型</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">控制模型总开关及单次任务输入输出限制。</p></div>
          <strong className="text-sm text-[var(--brand-primary)]">{enabledCount}/{models.length} 已开启</strong>
        </div>
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {models.map((model) => (
            <article key={model.id} className="rounded-lg border bg-white p-4" style={{ borderColor: model.enabled ? "var(--border-base)" : "var(--gray-200)", opacity: model.enabled ? 1 : 0.72 }}>
              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 items-start gap-3">
                  <input type="checkbox" checked={model.enabled} onChange={() => toggleModel(model.id)} className="mt-1 size-4 accent-[var(--brand-primary)]" />
                  <span className="min-w-0"><strong className="block truncate text-sm text-[var(--text-title)]">{model.name}</strong><span className="block truncate text-xs text-[var(--text-secondary)]">{model.code}</span></span>
                </label>
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${model.enabled ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}>{model.enabled ? "开启" : "关闭"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LimitInput model={model} field="inputCount" label="输入图" onChange={updateLimit} />
                <LimitInput model={model} field="singleMb" label="单图MB" onChange={updateLimit} />
                <LimitInput model={model} field="totalMb" label="总量MB" onChange={updateLimit} />
                <LimitInput model={model} field="outputCount" label="输出图" onChange={updateLimit} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[var(--text-title)]">模块模型</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">共 {rules.length} 个生图模块；全局关闭的模型不会出现在默认模型选项中。</p>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}>
          <div className="grid min-w-[980px] grid-cols-[180px_230px_minmax(520px,1fr)] gap-4 border-b bg-[var(--gray-50)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
            <span>模块</span><span>默认模型</span><span>可选模型</span>
          </div>
          {rules.map((rule) => {
            const defaultOptions = models.filter((model) => model.enabled && rule.allowedModels.includes(model.id))
            return (
              <article key={rule.id} className="grid min-w-[980px] grid-cols-[180px_230px_minmax(520px,1fr)] items-center gap-4 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--border-light)" }}>
                <div><strong className="block text-sm text-[var(--text-title)]">{rule.name}</strong><span className="text-xs text-[var(--text-secondary)]">{rule.group}</span></div>
                <select value={rule.defaultModel} onChange={(event) => setDefaultModel(rule.id, event.target.value)} aria-label={`${rule.name}默认模型`} className="h-9 rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }}>
                  {defaultOptions.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => {
                    const selected = rule.allowedModels.includes(model.id)
                    return (
                      <label key={model.id} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs ${model.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-45"}`} style={{ borderColor: selected ? "var(--brand-primary)" : "var(--border-base)", color: selected ? "var(--brand-primary)" : "var(--text-secondary)", background: selected ? "var(--brand-primary-soft)" : "var(--white)" }}>
                        <input type="checkbox" checked={selected} disabled={!model.enabled} onChange={() => toggleAllowedModel(rule.id, model.id)} className="size-3.5 accent-[var(--brand-primary)]" />
                        {model.name}
                      </label>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}

function LimitInput({ model, field, label, onChange }) {
  return (
    <label>
      <span className="mb-1 block text-[11px] text-[var(--text-secondary)]">{label}</span>
      <input type="number" min="1" value={model[field]} onChange={(event) => onChange(model.id, field, event.target.value)} aria-label={`${model.name}${label}`} className="h-8 w-full rounded-md border bg-white px-2 text-sm tabular-nums outline-none disabled:bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }} disabled={!model.enabled} />
    </label>
  )
}
