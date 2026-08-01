import { demoCurrentUser, demoPointsState } from "@/data/demo/points"

const STORAGE_KEY = "xianma-points-prototype-v1"
export const POINTS_CHANGE_EVENT = "xianma-points-change"
export const DEFAULT_REQUEST_AMOUNT = 1000
export const MAX_REQUEST_AMOUNT = 5000

function cloneInitialState() {
  return JSON.parse(JSON.stringify(demoPointsState))
}

export function getCurrentUser() {
  return demoCurrentUser
}

export function readPointsState() {
  if (typeof window === "undefined") return cloneInitialState()

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : cloneInitialState()
  } catch {
    return cloneInitialState()
  }
}

function writePointsState(nextState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  window.dispatchEvent(new CustomEvent(POINTS_CHANGE_EVENT, { detail: nextState }))
  return nextState
}

function createId(prefix) {
  const date = new Date()
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")
  return `${prefix}-${stamp}-${String(date.getTime()).slice(-6)}`
}

export function submitPointsRequest({ reason, amount }) {
  const state = readPointsState()
  if (state.requests.some((request) => request.status === "pending" && request.applicantId === demoCurrentUser.id)) {
    throw new Error("已有待审批申请，请等待处理后再提交")
  }

  const parsedAmount = Number(amount)
  if (!Number.isInteger(parsedAmount) || parsedAmount < 1 || parsedAmount > MAX_REQUEST_AMOUNT) {
    throw new Error(`申请积分必须是 1-${MAX_REQUEST_AMOUNT} 的整数`)
  }

  const trimmedReason = reason.trim()
  if (trimmedReason.length < 10 || trimmedReason.length > 200) {
    throw new Error("申请事由请填写 10-200 个字符")
  }

  const request = {
    id: createId("PA"),
    applicantId: demoCurrentUser.id,
    applicantName: demoCurrentUser.name,
    department: demoCurrentUser.department,
    account: demoCurrentUser.account,
    reason: trimmedReason,
    amount: parsedAmount,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewer: null,
    reviewComment: "",
  }

  return writePointsState({ ...state, requests: [request, ...state.requests] })
}

export function reviewPointsRequest(id, action, comment = "") {
  const state = readPointsState()
  const request = state.requests.find((item) => item.id === id)
  if (!request) throw new Error("未找到该积分申请")
  if (request.status !== "pending") throw new Error("该申请已处理，请刷新后查看")
  if (action === "reject" && !comment.trim()) throw new Error("驳回时必须填写审批意见")

  const reviewedAt = new Date().toISOString()
  const approved = action === "approve"
  const balance = approved ? state.balance + request.amount : state.balance
  const requests = state.requests.map((item) => item.id === id ? {
    ...item,
    status: approved ? "approved" : "rejected",
    reviewedAt,
    reviewer: "系统管理员",
    reviewComment: comment.trim() || "同意",
  } : item)
  const ledger = approved ? [{
    id: createId("PL"),
    type: "grant",
    amount: request.amount,
    balanceAfter: balance,
    description: "积分申请审批通过",
    requestId: request.id,
    createdAt: reviewedAt,
  }, ...state.ledger] : state.ledger

  return writePointsState({ ...state, balance, requests, ledger })
}
