"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Clock3, Search, ShieldCheck, X, XCircle } from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { POINTS_CHANGE_EVENT, readPointsState, reviewPointsRequest } from "@/lib/points-store"

const filters = [{ key: "all", label: "全部" }, { key: "pending", label: "待审批" }, { key: "approved", label: "已通过" }, { key: "rejected", label: "已驳回" }]
const statusLabels = { pending: "待审批", approved: "已通过", rejected: "已驳回" }

function formatTime(value) {
  return value ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "-"
}

export default function PointsRequestsPage() {
  const [state, setState] = useState(() => readPointsState())
  const [filter, setFilter] = useState("pending")
  const [keyword, setKeyword] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const sync = (event) => setState(event.detail || readPointsState())
    window.addEventListener(POINTS_CHANGE_EVENT, sync)
    return () => window.removeEventListener(POINTS_CHANGE_EVENT, sync)
  }, [])

  const visibleRequests = useMemo(() => state.requests.filter((request) => {
    const matchesStatus = filter === "all" || request.status === filter
    const query = keyword.trim().toLowerCase()
    const matchesKeyword = !query || [request.applicantName, request.department, request.account, request.id].some((value) => value.toLowerCase().includes(query))
    return matchesStatus && matchesKeyword
  }), [filter, keyword, state.requests])

  const selected = state.requests.find((request) => request.id === selectedId) || visibleRequests[0] || null
  const pendingCount = state.requests.filter((request) => request.status === "pending").length

  function review(action) {
    setMessage("")
    try {
      const nextState = reviewPointsRequest(selected.id, action, comment)
      setState(nextState)
      setRejecting(false)
      setComment("")
      setMessage(action === "approve" ? `审批通过，已为 ${selected.applicantName} 增加 ${selected.amount} 积分` : "申请已驳回")
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <PageShell pathname="/admin/points-requests" description="系统管理员审批积分申请，审批通过后自动计入用户余额">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary label="待审批" value={pendingCount} emphasis />
        <Summary label="累计申请" value={state.requests.length} />
        <Summary label="当前演示账户余额" value={state.balance.toLocaleString()} suffix="积分" />
      </div>
      {message && <div className="mb-4 rounded-lg bg-[var(--info-bg)] px-4 py-3 text-sm text-[var(--info)]">{message}</div>}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border-base)" }}>
          {filters.map((item) => <button key={item.key} onClick={() => { setFilter(item.key); setSelectedId(null) }} className={`h-10 shrink-0 border-b-2 px-4 text-sm font-medium ${filter === item.key ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}>{item.label}</button>)}
        </div>
        <label className="relative block w-full lg:w-72"><Search size={16} className="absolute left-3 top-3 text-[var(--text-secondary)]" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索申请人、部门或单号" className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></label>
      </div>

      <div className="grid min-h-[480px] overflow-hidden rounded-lg border bg-white lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]" style={{ borderColor: "var(--border-base)" }}>
        <div className="border-b lg:border-b-0 lg:border-r" style={{ borderColor: "var(--border-base)" }}>
          {visibleRequests.length === 0 ? <div className="flex min-h-60 items-center justify-center p-6 text-sm text-[var(--text-secondary)]">当前没有符合条件的申请</div> : visibleRequests.map((request) => (
            <button key={request.id} onClick={() => setSelectedId(request.id)} className={`block w-full border-b p-4 text-left transition-colors last:border-b-0 ${selected?.id === request.id ? "bg-[var(--brand-primary-soft)]" : "hover:bg-[var(--bg-hover)]"}`} style={{ borderColor: "var(--border-base)" }}>
              <div className="flex items-center justify-between gap-3"><span className="font-medium text-[var(--text-title)]">{request.applicantName}</span><span className="font-semibold tabular-nums text-[var(--text-title)]">{request.amount.toLocaleString()}</span></div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]"><span>{request.department}</span><span>{statusLabels[request.status]}</span></div>
              <p className="mt-2 truncate text-xs text-[var(--text-secondary)]">{request.reason}</p>
            </button>
          ))}
        </div>

        {selected ? (
          <section className="flex min-w-0 flex-col">
            <div className="border-b p-5" style={{ borderColor: "var(--border-base)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-[var(--text-secondary)]">申请单号 {selected.id}</p><h2 className="mt-1 text-lg font-semibold text-[var(--text-title)]">{selected.amount.toLocaleString()} 积分</h2></div><StatusBadge status={selected.status} /></div>
            </div>
            <div className="flex-1 space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2"><Detail label="申请人" value={selected.applicantName} /><Detail label="部门" value={selected.department} /><Detail label="账号" value={selected.account} /><Detail label="提交时间" value={formatTime(selected.createdAt)} /></div>
              <div><p className="text-xs text-[var(--text-secondary)]">申请事由</p><p className="mt-2 rounded-lg bg-[var(--gray-50)] p-3 text-sm leading-6 text-[var(--text-body)]">{selected.reason}</p></div>
              {selected.status !== "pending" && <div className="grid gap-4 border-t pt-5 sm:grid-cols-2" style={{ borderColor: "var(--border-base)" }}><Detail label="审批人" value={selected.reviewer} /><Detail label="审批时间" value={formatTime(selected.reviewedAt)} /><div className="sm:col-span-2"><Detail label="审批意见" value={selected.reviewComment} /></div></div>}
            </div>
            {selected.status === "pending" && <div className="flex justify-end gap-3 border-t p-4" style={{ borderColor: "var(--border-base)" }}><Button variant="outline" className="gap-2 text-[var(--danger)]" onClick={() => { setRejecting(true); setComment(""); setMessage("") }}><XCircle size={16} />驳回</Button><Button className="gap-2 text-[var(--brand-on-primary)]" onClick={() => review("approve")}><Check size={16} />通过并加积分</Button></div>}
          </section>
        ) : <div className="flex min-h-72 flex-col items-center justify-center gap-2 p-6 text-center"><ShieldCheck size={32} className="text-[var(--text-disabled)]" /><p className="text-sm text-[var(--text-secondary)]">选择一条申请查看详情</p></div>}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setRejecting(false)}>
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-base)" }}><h2 id="reject-dialog-title" className="font-semibold text-[var(--text-title)]">驳回积分申请</h2><button onClick={() => setRejecting(false)} aria-label="关闭驳回弹窗" className="rounded-md p-2 hover:bg-[var(--bg-hover)]"><X size={18} /></button></div>
            <div className="p-5"><label className="text-sm font-medium text-[var(--text-body)]">审批意见 <span className="text-[var(--danger)]">*</span><textarea autoFocus value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={200} placeholder="请说明驳回原因，方便申请人修改后重新提交" className="mt-2 w-full resize-none rounded-lg border p-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></label></div>
            <div className="flex justify-end gap-3 border-t px-5 py-4" style={{ borderColor: "var(--border-base)" }}><Button variant="outline" onClick={() => setRejecting(false)}>取消</Button><Button disabled={!comment.trim()} onClick={() => review("reject")} className="bg-[var(--danger)] text-[var(--brand-on-primary)] hover:bg-[var(--danger)]">确认驳回</Button></div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function Summary({ label, value, suffix, emphasis }) {
  return <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }}><p className="text-xs text-[var(--text-secondary)]">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${emphasis ? "text-[var(--warning)]" : "text-[var(--text-title)]"}`}>{value} {suffix && <span className="text-xs font-normal text-[var(--text-secondary)]">{suffix}</span>}</p></div>
}

function Detail({ label, value }) { return <div><p className="text-xs text-[var(--text-secondary)]">{label}</p><p className="mt-1 break-words text-sm text-[var(--text-body)]">{value}</p></div> }

function StatusBadge({ status }) {
  const options = { pending: { icon: Clock3, color: "var(--warning)", bg: "var(--warning-bg)" }, approved: { icon: Check, color: "var(--success)", bg: "var(--success-bg)" }, rejected: { icon: XCircle, color: "var(--danger)", bg: "var(--danger-bg)" } }
  const option = options[status]
  const Icon = option.icon
  return <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: option.color, background: option.bg }}><Icon size={13} />{statusLabels[status]}</span>
}
