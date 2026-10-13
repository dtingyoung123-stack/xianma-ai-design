"use client"
import { useSyncExternalStore } from "react"
import { initialWorkflows, workflowTaskExamples, upgradeDefaultWorkflowDemo } from "@/data/demo/workflows"
const key = "xianma-workflow-prototype-v1"
const initial = { templates: initialWorkflows, tasks: workflowTaskExamples, userId: "wf-author" }
let cache = initial, rawCache, loaded = false
const listeners = new Set()
function read() {
  if (typeof window === "undefined") return initial
  let raw
  try { raw = localStorage.getItem(key) } catch { return cache }
  if (!loaded || raw !== rawCache) {
    loaded = true; rawCache = raw
    try { const value = JSON.parse(raw); cache = value && Array.isArray(value.templates) && Array.isArray(value.tasks) ? upgradeDefaultWorkflowDemo(value) : initial } catch { cache = initial }
  }
  return cache
}
function subscribe(listener) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener) }
}
export function useWorkflowStore() { return useSyncExternalStore(subscribe, read, () => initial) }
export function saveWorkflows(change) {
  const next = change(read())
  // Write before broadcasting: quota failures must not appear as saved.
  localStorage.setItem(key, JSON.stringify(next)); cache = next; rawCache = JSON.stringify(next); loaded = true
  listeners.forEach(listener => listener())
  return next
}
