"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, CircleDollarSign, Clock3, FileText, Plus, X, XCircle } from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_REQUEST_AMOUNT,
  getCurrentUser,
  MAX_REQUEST_AMOUNT,
  POINTS_CHANGE_EVENT,
  readPointsState,
  submitPointsRequest,
} from "@/lib/points-store"

const statusMeta = {
  pending: { label: "待审批", icon: Clock3, color: "var(--warning)", background: "var(--warning-bg)" },
  approved: { label: "已通过", icon: CheckCircle2, color: "var(--success)", background: "var(--success-bg)" },
  rejected: { label: "已驳回", icon: XCircle, color: "var(--danger)", background: "var(--danger-bg)" },
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export default function PointsPage() {
  const user = getCurrentUser()
  const [state, setState] = useState(() => readPointsState())
  const [activeTab, setActiveTab] = useState("requests")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState(DEFAULT_REQUEST_AMOUNT)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const sync = (event) => setState(event.detail || readPointsState())
    window.addEventListener(POINTS_CHANGE_EVENT, sync)
    return () => window.removeEventListener(POINTS_CHANGE_EVENT, sync)
  }, [])

  const pendingRequest = useMemo(
    () => state.requests.find((request) => request.applicantId === user.id && request.status === "pending"),
    [state.requests, user.id]
  )

  function openDialog() {
    setError("")
    setSuccess("")
    setReason("")
    setAmount(DEFAULT_REQUEST_AMOUNT)
    setDialogOpen(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError("")
    try {
      const nextState = submitPointsRequest({ reason, amount })
      setState(nextState)
      setDialogOpen(false)
      setSuccess("积分申请已提交，等待系统管理员审批")
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <PageShell pathname="/points" description="查看积分余额、申请进度和收支记录">
      <section className="mb-6 flex flex-col gap-4 rounded-lg border bg-[var(--bg-card)] p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
            <CircleDollarSign size={25} />
          </span>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">当前可用积分</p>
            <p className="mt-1 text-[28px] font-bold tabular-nums text-[var(--text-title)]">{state.balance.toLocaleString()}</p>
          </div>
        </div>
        <Button onClick={openDialog} disabled={Boolean(pendingRequest)} className="h-10 gap-2 text-[var(--brand-on-primary)] sm:w-auto">
          <Plus size={16} />{pendingRequest ? "申请审批中" : "申请积分"}
        </Button>
      </section>

      {success && <div className="mb-4 rounded-lg bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success)]">{success}</div>}
      {pendingRequest && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning)]">
          <Clock3 className="mt-0.5 shrink-0" size={16} />
          你有一笔 {pendingRequest.amount.toLocaleString()} 积分的申请正在审批，处理完成前不能重复提交。
        </div>
      )}

      <div className="mb-4 flex border-b" style={{ borderColor: "var(--border-base)" }} role="tablist">
        {[{ key: "requests", label: "申请记录" }, { key: "ledger", label: "积分流水" }].map((tab) => (
          <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} className={`h-10 border-b-2 px-4 text-sm font-medium ${activeTab === tab.key ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "requests" ? (
        <div className="overflow-hidden rounded-lg border bg-[var(--bg-card)]" style={{ borderColor: "var(--border-base)" }}>
          {state.requests.length === 0 ? <EmptyState text="暂无积分申请记录" /> : state.requests.map((request) => {
            const meta = statusMeta[request.status]
            const StatusIcon = meta.icon
            return (
              <article key={request.id} className="border-b p-4 last:border-b-0" style={{ borderColor: "var(--border-base)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-[var(--text-title)]">{request.amount.toLocaleString()} 积分</span>
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: meta.color, background: meta.background }}><StatusIcon size={13} />{meta.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-body)]">{request.reason}</p>
                    {request.status === "rejected" && <p className="mt-2 text-xs text-[var(--danger)]">审批意见：{request.reviewComment}</p>}
                  </div>
                  <div className="text-right text-xs text-[var(--text-secondary)]">
                    <p>{request.id}</p><p className="mt-1">提交于 {formatTime(request.createdAt)}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-[var(--bg-card)]" style={{ borderColor: "var(--border-base)" }}>
          {state.ledger.length === 0 ? <EmptyState text="暂无积分流水" /> : state.ledger.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0" style={{ borderColor: "var(--border-base)" }}>
              <div><p className="text-sm font-medium text-[var(--text-title)]">{item.description}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{formatTime(item.createdAt)} · 余额 {item.balanceAfter}</p></div>
              <span className={`font-semibold tabular-nums ${item.amount > 0 ? "text-[var(--success)]" : "text-[var(--text-body)]"}`}>{item.amount > 0 ? "+" : ""}{item.amount}</span>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDialogOpen(false)}>
          <div className="flex max-h-[calc(100vh-32px)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="points-dialog-title">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-base)" }}>
              <div><h2 id="points-dialog-title" className="text-base font-semibold text-[var(--text-title)]">申请积分</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">提交后由系统管理员审批</p></div>
              <button onClick={() => setDialogOpen(false)} aria-label="关闭申请弹窗" className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 overflow-y-auto p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="姓名" value={user.name} /><ReadOnlyField label="部门" value={user.department} />
                </div>
                <ReadOnlyField label="账号" value={user.account} />
                <label className="block text-sm font-medium text-[var(--text-body)]">申请事由 <span className="text-[var(--danger)]">*</span>
                  <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} rows={4} placeholder="请说明积分用途，如用于生成新品买家秀" className="mt-2 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)]" style={{ borderColor: "var(--border-base)" }} />
                  <span className="mt-1 block text-right text-xs font-normal text-[var(--text-secondary)]">{reason.length}/200</span>
                </label>
                <label className="block text-sm font-medium text-[var(--text-body)]">申请积分 <span className="text-[var(--danger)]">*</span>
                  <input type="number" min="1" max={MAX_REQUEST_AMOUNT} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)]" style={{ borderColor: "var(--border-base)" }} />
                  <span className="mt-1 block text-xs font-normal text-[var(--text-secondary)]">单次最多申请 {MAX_REQUEST_AMOUNT.toLocaleString()} 积分，默认 {DEFAULT_REQUEST_AMOUNT.toLocaleString()}</span>
                </label>
                {error && <p className="rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">{error}</p>}
              </div>
              <div className="flex justify-end gap-3 border-t px-5 py-4" style={{ borderColor: "var(--border-base)" }}><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button type="submit" className="text-[var(--brand-on-primary)]">提交申请</Button></div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function ReadOnlyField({ label, value }) {
  return <label className="block text-sm font-medium text-[var(--text-body)]">{label}<input value={value} readOnly className="mt-2 h-10 w-full rounded-lg border bg-[var(--gray-50)] px-3 text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }} /></label>
}

function EmptyState({ text }) {
  return <div className="flex min-h-52 flex-col items-center justify-center gap-2 p-6 text-center"><FileText size={30} className="text-[var(--text-disabled)]" /><p className="text-sm text-[var(--text-secondary)]">{text}</p></div>
}
