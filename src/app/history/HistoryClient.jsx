"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  FolderPlus,
  Heart,
  ImageIcon,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import PageShell from "@/components/PageShell"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import { historyAccounts, historyOriginalImages, historyRecords, historySources } from "@/data/demo/history"

const PAGE_SIZE = 12
const CURRENT_ACCOUNT_ID = "current"

const parameterLabels = {
  model: "模型",
  resolution: "清晰度",
  ratio: "比例",
  quality: "画质",
  count: "张数",
  language: "语言",
  category: "品类",
  scene: "场景",
}

const sourceRoutes = {
  expert: "/image-tools/expert",
  "text-edit": "/image-tools/text-edit",
  "subject-replace": "/image-tools/subject-replace",
  "product-refine": "/image-tools/product-refine",
  "batch-beautify": "/image-tools/batch-beautify",
  "batch-edit": "/image-tools/batch-edit",
  "ai-hub": "/ai-hub",
  "multi-angle": "/ai-hub/multi-angle",
  "buyer-show": "/ai-hub/buyer-show",
  "video-stream": "/ai-hub/video-stream",
  "product-suite": "/ai-hub/product-suite",
}

export default function HistoryClient() {
  const searchParams = useSearchParams()
  const sourceFromUrl = searchParams.get("source") || "all"
  const [scope, setScope] = useState("mine")
  const [source, setSource] = useState(historySources.some((item) => item.value === sourceFromUrl) ? sourceFromUrl : "all")
  const [account, setAccount] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [records, setRecords] = useState(historyRecords)
  const [favoriteIds, setFavoriteIds] = useState(() => historyRecords.filter((record) => record.favorite).map((record) => record.id))
  const [materialIds, setMaterialIds] = useState([])
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimer = useRef(null)
  const toastTimer = useRef(null)
  const activeParams = [...searchParams.entries()].filter(([key, value]) => parameterLabels[key] && value)

  const filtered = useMemo(() => records.filter((record) => {
    const matchesScope = scope === "all" || record.accountId === CURRENT_ACCOUNT_ID
    const matchesAccount = scope === "mine" || account === "all" || record.accountId === account
    const matchesSource = source === "all" || record.source === source
    const recordDate = record.createdAt.slice(0, 10)
    const matchesStart = !startDate || recordDate >= startDate
    const matchesEnd = !endDate || recordDate <= endDate
    const searchText = `${record.id} ${record.title} ${record.prompt} ${record.model} ${record.accountName}`.toLowerCase()
    const matchesKeyword = !keyword.trim() || searchText.includes(keyword.trim().toLowerCase())
    return matchesScope && matchesAccount && matchesSource && matchesStart && matchesEnd && matchesKeyword
  }), [account, endDate, keyword, records, scope, source, startDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visibleRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => () => {
    window.clearTimeout(refreshTimer.current)
    window.clearTimeout(toastTimer.current)
  }, [])

  function showToast(message) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }

  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function refreshRecords() {
    setRefreshing(true)
    window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => {
      setRefreshing(false)
      showToast("历史记录已刷新")
    }, 700)
  }

  async function copyPrompt(record) {
    try {
      await navigator.clipboard.writeText(record.prompt)
      showToast("提示词已复制")
    } catch {
      showToast("复制失败，请在详情中手动复制")
    }
  }

  function toggleFavorite(record) {
    setFavoriteIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])
    showToast(favoriteIds.includes(record.id) ? "已取消收藏" : "已收藏")
  }

  function addToMaterials(record) {
    if (materialIds.includes(record.id)) {
      showToast("该记录已加入素材库")
      return
    }
    setMaterialIds((current) => [...current, record.id])
    showToast(`已将 ${record.count} 个结果加入素材库`)
  }

  function deleteRecord(record) {
    setRecords((current) => current.filter((item) => item.id !== record.id))
    setDialog(null)
    showToast("历史记录已删除")
  }

  return (
    <PageShell pathname="/history" description="查找、复用和管理各项 AI 生成记录。">
      {sourceFromUrl !== "all" && (
        <section className="mb-4 rounded-lg border px-4 py-3" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-[var(--text-title)]">来自 {searchParams.get("sourceLabel") || "工作流页面"}</strong>
            {activeParams.map(([key, value]) => <span key={key} className="rounded-full border bg-white px-2.5 py-1 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>{parameterLabels[key]}：{value}</span>)}
          </div>
        </section>
      )}

      <section className="mb-4 overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end" style={{ borderColor: "var(--border-light)" }}>
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">搜索记录</span>
            <span className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3" style={{ borderColor: "var(--border-base)" }}>
              <Search size={16} className="shrink-0 text-[var(--text-disabled)]" />
              <input value={keyword} onChange={(event) => updateFilter(setKeyword, event.target.value)} placeholder="搜索任务名称、ID、提示词或模型" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" />
            </span>
          </label>
          {scope === "all" && <SelectField label="账号" value={account} onChange={(value) => updateFilter(setAccount, value)} options={historyAccounts} />}
          <DateField label="开始日期" value={startDate} onChange={(value) => updateFilter(setStartDate, value)} max={endDate || undefined} />
          <DateField label="结束日期" value={endDate} onChange={(value) => updateFilter(setEndDate, value)} min={startDate || undefined} />
          <Button variant="outline" size="lg" className="h-10 gap-2 self-end" disabled={refreshing} onClick={refreshRecords}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "刷新中" : "刷新"}
          </Button>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-[var(--gray-100)] p-1" role="tablist" aria-label="历史记录范围">
              <ScopeTab selected={scope === "mine"} onClick={() => { setScope("mine"); setAccount("all"); setPage(1) }}>我的记录</ScopeTab>
              <ScopeTab selected={scope === "all"} onClick={() => updateFilter(setScope, "all")}>所有记录</ScopeTab>
            </div>
            <span className="shrink-0 text-sm text-[var(--text-secondary)]">共 <strong className="font-semibold text-[var(--text-title)]">{filtered.length}</strong> 条记录</span>
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-start" style={{ borderColor: "var(--border-light)" }}>
            <span className="shrink-0 pt-1.5 text-xs font-medium text-[var(--text-secondary)]">功能类型</span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" role="tablist" aria-label="历史记录功能筛选">
              {historySources.map((item) => (
                <button key={item.value} type="button" role="tab" aria-selected={source === item.value} onClick={() => updateFilter(setSource, item.value)} className="h-8 rounded-md border px-2.5 text-xs font-medium transition-colors" style={source === item.value ? { borderColor: "var(--brand-primary-border)", color: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {visibleRecords.length > 0 ? (
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${refreshing ? "pointer-events-none opacity-60" : ""}`} aria-busy={refreshing}>
          {visibleRecords.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              showAccount={scope === "all"}
              favorite={favoriteIds.includes(record.id)}
              inMaterials={materialIds.includes(record.id)}
              onFavorite={() => toggleFavorite(record)}
              onCopy={() => copyPrompt(record)}
              onDetail={() => setDialog({ type: "detail", record })}
              onDelete={() => setDialog({ type: "delete", record })}
              onAddToMaterials={() => addToMaterials(record)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onReset={() => { setKeyword(""); setAccount("all"); setStartDate(""); setEndDate(""); setSource("all"); setPage(1) }} />
      )}

      {filtered.length > PAGE_SIZE && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      {dialog?.type === "detail" && <HistoryDetailDialog record={dialog.record} showAccount={scope === "all"} onClose={() => setDialog(null)} onCopy={() => copyPrompt(dialog.record)} onAdd={() => addToMaterials(dialog.record)} />}
      {dialog?.type === "delete" && <DeleteHistoryDialog record={dialog.record} onClose={() => setDialog(null)} onConfirm={() => deleteRecord(dialog.record)} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-[var(--gray-900)] px-4 py-2.5 text-sm text-white shadow-lg" role="status">{toast}</div>}
    </PageShell>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="w-full shrink-0 lg:w-44">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function DateField({ label, value, onChange, min, max }) {
  return (
    <label className="w-full shrink-0 lg:w-40">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      <span className="relative block">
        <CalendarDays size={15} className="pointer-events-none absolute left-3 top-3 text-[var(--text-disabled)]" />
        <input type="date" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border bg-white pl-9 pr-2 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
      </span>
    </label>
  )
}

function ScopeTab({ selected, onClick, children }) {
  return <button type="button" role="tab" aria-selected={selected} onClick={onClick} className="h-8 min-w-24 rounded-md px-3 text-sm font-medium transition-colors" style={selected ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}>{children}</button>
}

function HistoryCard({ record, showAccount, favorite, inMaterials, onFavorite, onCopy, onDetail, onDelete, onAddToMaterials }) {
  const sourceLabel = historySources.find((item) => item.value === record.source)?.label
  const statusComplete = record.status === "已完成"
  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
      <div role="button" tabIndex={0} aria-label={`查看${record.title}详情`} onClick={onDetail} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onDetail() } }} className="block w-full flex-1 cursor-pointer text-left outline-none focus-visible:shadow-[var(--focus-ring)]">
        <div className="relative">
          <PreviewGrid images={record.previewImages} title={record.title} count={record.count} />
          <span className="absolute bottom-2 left-2 rounded-md bg-[var(--gray-900)]/85 px-2 py-1 text-[11px] font-medium text-white">{record.count} 个结果</span>
        </div>

        <div className="p-3 pb-2.5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[var(--brand-primary)]">{sourceLabel}</span>
              <h2 className="mt-0.5 truncate text-sm font-semibold text-[var(--text-title)]" title={record.title}>{record.title}</h2>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" style={{ color: statusComplete ? "var(--success)" : "var(--warning)", background: statusComplete ? "var(--success-bg)" : "var(--warning-bg)" }}>
              {statusComplete ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{record.status}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-[18px] text-[var(--text-secondary)]">{record.prompt}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-body)]">{record.model}</span>
            <span>{record.spec}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[11px] text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>
            <span>{record.time}</span>
            <span className="font-mono text-[10px]">{record.id}</span>
            {showAccount && <span className="inline-flex items-center gap-1"><UserRound size={12} />{record.accountName}</span>}
          </div>
        </div>
      </div>

      <button type="button" aria-label={favorite ? "取消收藏" : "收藏记录"} title={favorite ? "取消收藏" : "收藏"} onClick={onFavorite} className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-lg border bg-white/95 shadow-sm" style={{ borderColor: favorite ? "var(--brand-primary-border)" : "var(--border-base)", color: favorite ? "var(--brand-primary)" : "var(--text-secondary)" }}>
        <Heart size={16} fill={favorite ? "currentColor" : "none"} />
      </button>

      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
        <Button size="sm" className="h-9 gap-1.5 px-3 text-white" onClick={onDetail}><Eye size={14} />查看详情</Button>
        <IconAction label="复制提示词" onClick={onCopy}><Copy size={15} /></IconAction>
        <IconAction label={inMaterials ? "已加入素材库" : "整条加入素材库"} onClick={onAddToMaterials} active={inMaterials}><FolderPlus size={15} /></IconAction>
        <IconAction label="删除记录" onClick={onDelete} danger><Trash2 size={15} /></IconAction>
        <Link href={`${sourceRoutes[record.source]}?historyId=${encodeURIComponent(record.id)}`} className="ml-auto inline-flex h-9 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">
          <PencilLine size={14} />继续编辑
        </Link>
      </div>
    </article>
  )
}

function PreviewGrid({ images, title, count }) {
  const visible = images.slice(0, 4)
  if (!visible.length) return <div className="grid aspect-[16/9] place-items-center bg-[var(--gray-100)] text-[var(--text-disabled)]"><ImageIcon size={32} /></div>
  if (visible.length === 1) return <SafeImage src={visible[0]} alt={`${title}结果预览`} className="aspect-[16/9] w-full bg-[var(--gray-100)] object-cover" />
  return (
    <div className="grid aspect-[16/9] grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-[var(--border-light)]">
      {visible.map((src, index) => (
        <div key={src} className={index === 0 ? "row-span-2 min-h-0" : "relative min-h-0"}>
          <SafeImage src={src} alt={`${title}结果 ${index + 1}`} className="h-full w-full object-cover" />
          {index === 3 && count > 4 && <span className="absolute inset-0 grid place-items-center bg-[var(--gray-900)]/65 text-sm font-semibold text-white">+{count - 4}</span>}
        </div>
      ))}
    </div>
  )
}

function IconAction({ label, onClick, active = false, danger = false, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-9 place-items-center rounded-md border transition-colors" style={{ borderColor: active ? "var(--brand-primary-border)" : "var(--border-base)", color: danger ? "var(--danger)" : active ? "var(--brand-primary)" : "var(--text-secondary)", background: active ? "var(--brand-primary-soft)" : "var(--white)" }}>
      {children}
    </button>
  )
}

function EmptyState({ onReset }) {
  return (
    <section className="rounded-lg border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--border-base)" }}>
      <span className="mx-auto grid size-12 place-items-center rounded-lg bg-[var(--gray-100)] text-[var(--text-disabled)]"><Search size={22} /></span>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-title)]">没有符合条件的记录</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">调整账号、日期或功能筛选后再试。</p>
      <Button variant="outline" size="lg" className="mt-4" onClick={onReset}>清除筛选</Button>
    </section>
  )
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="历史记录分页">
      <Button variant="outline" size="icon-lg" aria-label="上一页" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></Button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <button key={number} type="button" aria-label={`第 ${number} 页`} aria-current={page === number ? "page" : undefined} onClick={() => onChange(number)} className="size-9 rounded-lg border text-sm font-medium" style={page === number ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary)", color: "var(--brand-on-primary)" } : { borderColor: "var(--border-base)", background: "var(--white)", color: "var(--text-body)" }}>{number}</button>
      ))}
      <Button variant="outline" size="icon-lg" aria-label="下一页" disabled={page === totalPages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></Button>
    </nav>
  )
}

function Modal({ title, description, onClose, width = "780px", footer, role = "dialog", children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (typeof document === "undefined") return null
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay-scrim)] p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role={role} aria-modal="true" aria-label={title} className="flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-h-[calc(100dvh-40px)]" style={{ maxWidth: width }}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b px-4 py-4 sm:px-5" style={{ borderColor: "var(--border-light)" }}>
          <div><h2 className="text-lg font-semibold text-[var(--text-title)]">{title}</h2>{description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}</div>
          <button type="button" autoFocus aria-label="关闭" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-light)" }}>{footer}</footer>}
      </section>
    </div>,
    document.body,
  )
}

function HistoryDetailDialog({ record, showAccount, onClose, onCopy, onAdd }) {
  const sourceLabel = historySources.find((item) => item.value === record.source)?.label
  const originalImages = historyOriginalImages[record.source] || []
  return (
    <Modal title={record.title} description={`${sourceLabel} · ${record.id}`} width="960px" onClose={onClose} footer={<><Button variant="outline" size="lg" className="gap-2" onClick={onCopy}><Copy size={15} />复制提示词</Button><Button size="lg" className="gap-2 text-white" onClick={onAdd}><FolderPlus size={15} />整条加入素材库</Button></>}>
      <div className="flex flex-wrap gap-2">
        <DetailChip>{new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false })}</DetailChip>
        <DetailChip>{record.model}</DetailChip>
        <DetailChip>{record.spec}</DetailChip>
        <DetailChip>{record.count} 个结果</DetailChip>
        {showAccount && <DetailChip>{record.accountName}</DetailChip>}
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-[var(--text-title)]">提示词</h3>
        <div className="mt-2 rounded-lg border p-3 text-sm leading-6 text-[var(--text-body)]" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}>
          {record.prompt}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ImageGallery title="原图" images={originalImages} altPrefix={`${record.title}原图`} compact />
        <ImageGallery title="结果图" images={record.previewImages} altPrefix={`${record.title}结果图`} />
      </div>
    </Modal>
  )
}

function DetailChip({ children }) {
  return <span className="rounded-md border bg-[var(--gray-50)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>{children}</span>
}

function ImageGallery({ title, images, altPrefix, compact = false }) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-title)]">{title}</h3>
        <span className="text-xs text-[var(--text-secondary)]">{images.length} 张</span>
      </div>
      {images.length ? (
        <div className={`mt-2 grid gap-2 ${compact ? "grid-cols-2 lg:grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {images.map((src, index) => (
            <figure key={`${src}-${index}`} className="overflow-hidden rounded-lg border bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>
              <SafeImage src={src} alt={`${altPrefix} ${index + 1}`} className="aspect-square w-full object-cover" />
              <figcaption className="border-t px-2.5 py-2 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>{title} {index + 1}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-2 grid min-h-32 place-items-center rounded-lg border border-dashed bg-[var(--gray-50)] text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>本次记录未上传原图</div>
      )}
    </section>
  )
}

function DeleteHistoryDialog({ record, onClose, onConfirm }) {
  return (
    <Modal role="alertdialog" title="删除历史记录" description="删除后将从历史记录中移除，原型中不提供恢复。" onClose={onClose} width="460px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button><Button variant="destructive" size="lg" className="gap-2" onClick={onConfirm}><Trash2 size={15} />确认删除</Button></>}>
      <strong className="block text-sm text-[var(--text-title)]">{record.title}</strong>
      <span className="mt-1 block text-xs text-[var(--text-secondary)]">{record.id} · {record.time}</span>
    </Modal>
  )
}
