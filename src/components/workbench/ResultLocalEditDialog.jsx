"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Check, History, LoaderCircle, PencilLine, RefreshCw } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"

const fallbackDirections = [
  { key: "detail", title: "修正局部细节", desc: "改善边缘、材质和结构细节" },
  { key: "relation", title: "调整主体关系", desc: "校准比例、遮挡和接触关系" },
  { key: "light", title: "统一光影", desc: "让局部明暗与原图保持一致" },
  { key: "natural", title: "提升真实感", desc: "减少生成痕迹和不自然细节" },
]

export default function ResultLocalEditDialog({
  result,
  context = {},
  directions = fallbackDirections,
  candidateImages = [],
  onApply,
  onClose,
  onNotify,
}) {
  const safeDirections = directions.length ? directions : fallbackDirections
  const [directionKey, setDirectionKey] = useState(safeDirections[0].key)
  const [instruction, setInstruction] = useState(() => safeDirections[0].defaultInstruction || safeDirections[0].desc)
  const [candidateSeed, setCandidateSeed] = useState(0)
  const [selectedCandidateId, setSelectedCandidateId] = useState("candidate-0")
  const [selectedVersionId, setSelectedVersionId] = useState(result.currentVersionId || result.versions?.at(-1)?.id || "original")
  const [candidateStatus, setCandidateStatus] = useState("ready")
  const [applyStatus, setApplyStatus] = useState("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const versions = useMemo(() => normalizeVersions(result), [result])
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) || versions.at(-1)
  const candidates = useMemo(() => buildCandidates(candidateImages, result.src, candidateSeed), [candidateImages, candidateSeed, result.src])
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) || candidates[0]
  const canApply = Boolean(selectedCandidate && instruction.trim() && applyStatus !== "loading")

  function chooseDirection(direction) {
    setDirectionKey(direction.key)
    setInstruction(direction.defaultInstruction || direction.desc)
  }

  function refreshCandidates() {
    setCandidateStatus("loading")
    setErrorMessage("")
    window.setTimeout(() => {
      setCandidateSeed((value) => value + 1)
      setSelectedCandidateId("candidate-0")
      setCandidateStatus("ready")
      onNotify?.("已更新局部编辑候选")
    }, 500)
  }

  async function applyCandidate() {
    if (!canApply) return
    setApplyStatus("loading")
    setErrorMessage("")
    try {
      const direction = safeDirections.find((item) => item.key === directionKey) || safeDirections[0]
      await onApply({ candidate: selectedCandidate, direction, instruction: instruction.trim() })
      onClose()
    } catch (error) {
      setApplyStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "局部编辑失败，请重试或退出。")
    }
  }

  return (
    <WorkbenchPickerDialog
      eyebrow="局部编辑"
      title={result.name || result.title || "当前结果"}
      description="只更新当前结果的最新版本，同一任务中的其他结果不受影响。"
      width="980px"
      onClose={onClose}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={onClose}>退出</Button>
          <Button type="button" className="gap-2 text-white" disabled={!canApply} onClick={applyCandidate}>
            {applyStatus === "loading" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
            {applyStatus === "loading" ? "正在应用" : "使用所选候选"}
          </Button>
        </>
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-lg border bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>
            <SafeImage key={selectedVersion?.src} src={selectedVersion?.src} alt={selectedVersion?.label || "结果版本"} className="aspect-square w-full object-contain" />
          </div>
          <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-2 rounded-lg bg-[var(--gray-50)] p-3 text-xs">
            <dt className="text-[var(--text-secondary)]">来源任务</dt><dd className="truncate text-[var(--text-body)]">{context.taskName || context.scene || "当前生成任务"}</dd>
            <dt className="text-[var(--text-secondary)]">生成参数</dt><dd className="text-[var(--text-body)]">{context.model || "沿用原任务"}{context.spec ? ` · ${context.spec}` : ""}</dd>
            <dt className="text-[var(--text-secondary)]">当前版本</dt><dd className="text-[var(--text-body)]">{selectedVersion?.label}</dd>
          </dl>

          <div className="mt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-title)]"><History size={15} />版本记录</h3>
            <div className="mt-2 grid gap-2">
              {versions.map((version, index) => {
                const selected = version.id === selectedVersion?.id
                return (
                  <button
                    key={version.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedVersionId(version.id)}
                    className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--gray-100)] text-[11px] font-semibold text-[var(--text-secondary)]">{index + 1}</span>
                    <span className="min-w-0"><strong className="block truncate text-xs text-[var(--text-title)]">{version.label}</strong><span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">{version.note || (index === 0 ? "保留的原始结果" : "局部编辑版本")}</span></span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-title)]">快速修改方向</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {safeDirections.map((direction) => {
                const selected = direction.key === directionKey
                return (
                  <button
                    key={direction.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseDirection(direction)}
                    className="min-h-16 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}
                  >
                    <strong className="block text-xs text-[var(--text-title)]">{direction.title}</strong>
                    <span className="mt-1 block text-[11px] leading-5 text-[var(--text-secondary)]">{direction.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-[var(--text-title)]">补充要求</span>
            <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={3} placeholder="补充本次需要修改的差异" className="mt-2 w-full resize-y rounded-lg border p-3 text-sm leading-6 text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }} />
          </label>

          <section className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-title)]">候选结果</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={candidateStatus === "loading"} onClick={refreshCandidates}>
                {candidateStatus === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                重新生成
              </Button>
            </div>

            {candidateStatus === "loading" ? (
              <div className="mt-2 flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }} role="status"><LoaderCircle size={24} className="mb-2 animate-spin" />正在生成候选结果</div>
            ) : candidates.length ? (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {candidates.map((candidate) => {
                  const selected = candidate.id === selectedCandidate?.id
                  return (
                    <button key={candidate.id} type="button" aria-pressed={selected} onClick={() => setSelectedCandidateId(candidate.id)} className="overflow-hidden rounded-lg border text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={selected ? { borderColor: "var(--brand-primary)", boxShadow: "var(--shadow-card)" } : { borderColor: "var(--border-base)" }}>
                      <SafeImage src={candidate.src} alt={candidate.title} className="aspect-[4/3] w-full bg-[var(--gray-50)] object-cover" />
                      <span className="flex items-start justify-between gap-2 p-3"><span><strong className="block text-xs text-[var(--text-title)]">{candidate.title}</strong><span className="mt-1 block text-[11px] leading-5 text-[var(--text-secondary)]">{candidate.note}</span></span>{selected && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)] text-white"><Check size={14} /></span>}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-2 flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}><PencilLine size={24} className="text-[var(--text-disabled)]" /><strong className="mt-2 text-sm text-[var(--text-title)]">暂无候选结果</strong><span className="mt-1 text-xs text-[var(--text-secondary)]">点击重新生成后继续。</span></div>
            )}
          </section>

          {errorMessage && <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--danger-bg)] p-3 text-xs text-[var(--danger)]" role="alert"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{errorMessage} 原结果已保留，可重试或退出。</span></div>}
        </div>
      </div>
    </WorkbenchPickerDialog>
  )
}

function normalizeVersions(result) {
  if (Array.isArray(result.versions) && result.versions.length) return result.versions
  return [{ id: "original", src: result.originalSrc || result.src, label: "原始结果", note: "保留的原始结果" }]
}

function buildCandidates(images, currentSrc, seed) {
  const pool = images.filter(Boolean)
  if (!pool.length) return []
  const currentIndex = Math.max(0, pool.indexOf(currentSrc))
  return Array.from({ length: Math.min(2, pool.length) }, (_, index) => ({
    id: `candidate-${index}`,
    src: pool[(currentIndex + seed + index + 1) % pool.length],
    title: `候选 ${String.fromCharCode(65 + index)}`,
    note: index === 0 ? "保留原构图，按修改方向轻量调整。" : "提供另一种局部处理结果用于比较。",
  }))
}
