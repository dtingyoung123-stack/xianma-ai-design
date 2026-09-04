"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleDashed,
  Eye,
  ImageOff,
  Paperclip,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import OrganizationScopeSelector from "@/components/OrganizationScopeSelector"
import RegionMaskEditor from "@/components/workbench/RegionMaskEditor"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { WorkbenchButton } from "@/components/workbench/Workbench"
import { organizationTree } from "@/data/demo/admin"
import { productRoleOptions } from "@/data/demo/products"
import { getProductDisplayStatus } from "@/lib/product-prototype.mjs"

const toneStyles = {
  neutral: { color: "var(--text-secondary)", background: "var(--gray-100)" },
  info: { color: "var(--info)", background: "var(--info-bg)" },
  warning: { color: "var(--warning)", background: "var(--warning-bg)" },
  danger: { color: "var(--danger)", background: "var(--danger-bg)" },
  success: { color: "var(--success)", background: "var(--success-bg)" },
}

export function ProductStatusBadge({ status, product }) {
  const meta = getProductDisplayStatus(status, product?.teamReviewStatus, product?.publicReviewStatus, product?.scope)
  return <span className="inline-flex min-h-6 items-center rounded-md px-2 text-xs font-semibold" style={toneStyles[meta.tone]}>{meta.label}</span>
}

export function ProductReviewDialog({ product, reviewType = "team", role, onClose, onApprove, onReject }) {
  const [mode, setMode] = useState("approve")
  const [organizationIds, setOrganizationIds] = useState(product.visibleOrgIds?.length ? product.visibleOrgIds : [product.orgId])
  const [reason, setReason] = useState("")
  const teamReview = reviewType === "team"
  const title = teamReview ? "审核团队商品" : "审核公共商品"
  const description = teamReview ? `${product.ownerName || "创建人"} · ${product.orgName || "所属组织"}` : "公共发布仅由系统管理员处理。"
  return <WorkbenchPickerDialog eyebrow={teamReview ? "团队入库" : "公共发布"} title={title} description={description} width={teamReview ? "820px" : "680px"} onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton>{mode === "approve" ? <WorkbenchButton disabled={teamReview && !organizationIds.length} onClick={() => onApprove(teamReview ? organizationIds : undefined)}>通过并发布</WorkbenchButton> : <WorkbenchButton disabled={!reason.trim()} onClick={() => onReject(reason.trim())}>确认驳回</WorkbenchButton>}</>}>
    <div className="rounded-lg border bg-[var(--gray-50)] p-4" style={{ borderColor: "var(--border-base)" }}><strong className="block text-sm text-[var(--text-title)]">{product.name}</strong><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{product.category} · {product.source}</p><CoverageSummary coverage={product.coverage} compact /></div>
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[var(--gray-100)] p-1"><button type="button" onClick={() => setMode("approve")} className={`h-9 rounded-md text-sm font-medium ${mode === "approve" ? "bg-white text-[var(--success)] shadow-sm" : "text-[var(--text-secondary)]"}`}>通过</button><button type="button" onClick={() => setMode("reject")} className={`h-9 rounded-md text-sm font-medium ${mode === "reject" ? "bg-white text-[var(--danger)] shadow-sm" : "text-[var(--text-secondary)]"}`}>驳回</button></div>
    {mode === "approve" ? (teamReview ? <OrganizationScopeSelector value={organizationIds} onChange={setOrganizationIds} organizations={organizationTree} allowedScopeIds={role === "system_admin" ? null : [product.orgId]} /> : <p className="mt-4 rounded-lg bg-[var(--success-bg)] p-3 text-xs leading-5 text-[var(--text-body)]">通过后商品将进入公共商品库，对全公司有效账号可见。</p>) : <label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">驳回原因</span><textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="请输入明确的修改建议" className="w-full resize-none rounded-md border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>}
  </WorkbenchPickerDialog>
}

export function ProductRoleSwitch({ role, onChange, compact = false }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {!compact && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"><ShieldCheck size={14} />当前身份</span>}
      <div className="flex min-w-0 overflow-x-auto rounded-lg bg-[var(--gray-100)] p-1" role="group" aria-label="当前身份">
        {productRoleOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={role === option.id}
            onClick={() => onChange(option.id)}
            className="h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition-colors"
            style={role === option.id ? { color: "var(--brand-primary)", background: "var(--white)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CoverageSummary({ coverage, compact = false }) {
  const items = [
    { key: "confirmed", label: "已确认", value: coverage?.confirmed || 0, color: "var(--success)", icon: CheckCircle2 },
    { key: "inferred", label: "AI 推断", value: coverage?.inferred || 0, color: "var(--info)", icon: Sparkles },
    { key: "missing", label: "待补充", value: coverage?.missing || 0, color: "var(--warning)", icon: CircleDashed },
  ]
  return (
    <div className={`grid ${compact ? "grid-cols-3 gap-1.5" : "grid-cols-1 gap-2 sm:grid-cols-3"}`}>
      {items.map(({ key, label, value, color, icon: Icon }) => (
        <div key={key} className="flex min-w-0 items-center gap-2 rounded-md bg-[var(--gray-50)] px-2.5 py-2">
          <Icon size={14} className="shrink-0" style={{ color }} />
          <span className="truncate text-xs text-[var(--text-secondary)]">{label}</span>
          <strong className="ml-auto tabular-nums text-xs text-[var(--text-title)]">{value}</strong>
        </div>
      ))}
    </div>
  )
}

export function CoveragePanel({ facts = [], editable = false, onChange, onEvidence }) {
  const groups = useMemo(() => [...new Set(facts.map((fact) => fact.group))], [facts])
  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <section key={group} className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
          <header className="flex items-center justify-between bg-[var(--gray-50)] px-3 py-2">
            <strong className="text-xs text-[var(--text-title)]">{group}</strong>
            <span className="text-[11px] text-[var(--text-secondary)]">{facts.filter((fact) => fact.group === group).length} 项</span>
          </header>
          <div className="divide-y divide-[var(--border-light)]">
            {facts.filter((fact) => fact.group === group).map((fact) => (
              <div key={fact.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <strong className="block text-xs text-[var(--text-title)]">{fact.label}</strong>
                  <FactState state={fact.state} />
                </div>
                {editable ? (
                  <input
                    value={fact.value}
                    onChange={(event) => onChange?.(fact.id, { value: event.target.value })}
                    className="h-9 min-w-0 rounded-md border px-3 text-sm text-[var(--text-body)] outline-none"
                    style={{ borderColor: "var(--border-base)" }}
                    aria-label={fact.label}
                  />
                ) : <span className="min-w-0 break-words text-sm text-[var(--text-body)]">{fact.value}</span>}
                <div className="flex items-center gap-2">
                  {editable && fact.state === "inferred" && <button type="button" onClick={() => onChange?.(fact.id, { state: "confirmed" })} className="h-8 rounded-md px-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">确认</button>}
                  <button type="button" disabled={!fact.evidenceIds?.length} onClick={() => onEvidence?.(fact)} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"><Eye size={13} />证据 {fact.evidenceIds?.length || 0}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function FactState({ state }) {
  const meta = {
    confirmed: { label: "已确认", style: toneStyles.success },
    inferred: { label: "AI 推断", style: toneStyles.info },
    missing: { label: "待补充", style: toneStyles.warning },
  }[state] || { label: state, style: toneStyles.neutral }
  return <span className="mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold" style={meta.style}>{meta.label}</span>
}

export function CandidateGrid({ candidates = [], selectedId, onSelect, onPreview, onRetry }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {candidates.map((candidate) => {
        const selected = candidate.id === selectedId || candidate.selected
        const failed = candidate.status === "failed"
        return (
          <article key={candidate.id} className="overflow-hidden rounded-lg border bg-white transition-shadow" style={{ borderColor: selected ? "var(--brand-primary)" : "var(--border-base)", boxShadow: selected ? "var(--shadow-card-soft)" : "none" }}>
            <div className="relative aspect-square bg-[var(--gray-100)]">
              {failed ? (
                <div className="grid h-full place-items-center p-6 text-center">
                  <div><ImageOff size={32} className="mx-auto text-[var(--danger)]" /><strong className="mt-3 block text-sm text-[var(--text-title)]">本张还原失败</strong><p className="mt-1 text-xs text-[var(--text-secondary)]">{candidate.error}</p></div>
                </div>
              ) : <SafeImage src={candidate.src} alt={candidate.label} className="h-full w-full object-contain" />}
              {selected && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2 py-1 text-xs font-semibold text-white"><Check size={13} />已选择</span>}
            </div>
            <div className="flex min-h-14 items-center justify-between gap-2 border-t px-3 py-2" style={{ borderColor: "var(--border-light)" }}>
              <strong className="text-sm text-[var(--text-title)]">{candidate.label}</strong>
              <div className="flex items-center gap-1.5">
                {failed ? <button type="button" onClick={() => onRetry?.(candidate)} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"><RotateCcw size={13} />重试</button> : <>
                  <button type="button" onClick={() => onPreview?.(candidate)} aria-label={`查看${candidate.label}`} className="grid size-8 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><Eye size={15} /></button>
                  <button type="button" onClick={() => onSelect?.(candidate.id)} className="h-8 rounded-md px-2.5 text-xs font-semibold" style={selected ? { color: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { color: "var(--text-body)", background: "var(--gray-100)" }}>选择</button>
                </>}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function ProductCorrectionDialog({ product, candidate, onClose, onSubmit }) {
  const [stage, setStage] = useState("region")
  const [selection, setSelection] = useState(null)
  const [types, setTypes] = useState([])
  const [note, setNote] = useState("")
  const [evidenceNames, setEvidenceNames] = useState([])
  const issueTypes = ["外形", "比例", "结构", "颜色", "材质", "图案", "其他"]

  if (stage === "region") {
    return (
      <RegionMaskEditor
        image={{ src: candidate.src, title: `${product.name} · ${candidate.label}` }}
        eyebrow="商品差异圈选"
        helpText="圈选一处或多处差异，并用文本标注说明具体位置。"
        applyLabel="继续填写问题"
        coverageLabel="已圈选区域"
        annotationLabel="条区域说明"
        annotationPlaceholder="例如：固定带连接位置不一致"
        showOperations={false}
        showUnavailableTools={false}
        onClose={onClose}
        onApply={(value) => {
          setSelection(value)
          setStage("details")
        }}
      />
    )
  }

  const canSubmit = selection && types.length > 0 && note.trim().length > 3
  return (
    <WorkbenchPickerDialog
      eyebrow="商品纠错"
      title="补充问题信息"
      description="本次圈选、问题类型、说明和佐证图片会与历史候选一并保留。"
      width="760px"
      onClose={onClose}
      footer={<>
        <WorkbenchButton variant="ghost" onClick={() => setStage("region")}>返回重选</WorkbenchButton>
        <WorkbenchButton disabled={!canSubmit} onClick={() => onSubmit({ selection, types, note: note.trim(), evidenceNames })}>提交并重新还原</WorkbenchButton>
      </>}
    >
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--success-bg)] p-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-body)]"><CheckCircle2 size={16} className="text-[var(--success)]" />已保存圈选区域</span>
          <span className="text-xs text-[var(--text-secondary)]">覆盖 {selection.coverage}% · 标注 {selection.annotations.length} 条</span>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-[var(--text-title)]">问题类型</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {issueTypes.map((type) => {
              const selected = types.includes(type)
              return <button key={type} type="button" aria-pressed={selected} onClick={() => setTypes((current) => selected ? current.filter((item) => item !== type) : [...current, type])} className="h-9 rounded-md border px-3 text-sm font-semibold" style={selected ? { color: "var(--brand-primary)", borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { color: "var(--text-body)", borderColor: "var(--border-base)" }}>{type}</button>
            })}
          </div>
        </fieldset>
        <label>
          <span className="text-sm font-semibold text-[var(--text-title)]">问题说明</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="说明还原图与原商品不一致的地方，以及希望保留的商品特征" className="mt-2 w-full resize-y rounded-lg border p-3 text-sm leading-6 text-[var(--text-body)] outline-none" style={{ borderColor: "var(--border-base)" }} />
        </label>
        <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><Upload size={18} /></span>
          <span className="min-w-0"><strong className="block text-sm text-[var(--text-title)]">补充佐证图片</strong><span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{evidenceNames.length ? evidenceNames.join("、") : "可选，用于说明正确结构或材质"}</span></span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => setEvidenceNames([...event.target.files].map((file) => file.name))} />
          <Paperclip size={16} className="ml-auto shrink-0 text-[var(--text-secondary)]" />
        </label>
        {!types.length && <p className="flex items-center gap-2 text-xs text-[var(--warning)]"><AlertTriangle size={14} />至少选择一个问题类型。</p>}
      </div>
    </WorkbenchPickerDialog>
  )
}
