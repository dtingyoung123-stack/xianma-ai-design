"use client"

import { useSyncExternalStore } from "react"
import { initialMaterials, personalGroupOptions, demoCurrentUser } from "@/data/demo/materials"
import { initialMaterialFolders, teamFolderDemoMaterials, initialTeamFolderAssignments, teamFolderDemoVersion } from "@/data/demo/material-folders"

// Isolated, versioned prototype storage; never used for production authorization.
const key = "xianma-material-folders-prototype-v1"
const initial = {
  materials: [...initialMaterials, ...teamFolderDemoMaterials],
  teamFolderDemoVersion,
  folders: [...initialMaterialFolders, ...personalGroupOptions.map((name, index) => ({ id: `personal-${index}`, name, scope: "personal", departmentId: "", parentId: "" }))],
  folderAssignments: initialTeamFolderAssignments,
  personalGroups: personalGroupOptions,
  personalGroupAssignments: Object.fromEntries(initialMaterials.map((material) => [material.id, material.personalGroupByUser?.[demoCurrentUser.id] || ""])),
  removedTeamIds: [],
  lastTeamLocation: null,
}
let snapshot = initial
let loaded = false
const listeners = new Set()
function getSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || "null")
      if (saved && Array.isArray(saved.folders) && Array.isArray(saved.materials)) {
        snapshot = { ...initial, ...saved }
        if (saved.teamFolderDemoVersion !== teamFolderDemoVersion) {
          snapshot = {
            ...snapshot,
            teamFolderDemoVersion,
            folders: [...saved.folders, ...initialMaterialFolders.filter((folder) => !saved.folders.some((item) => item.id === folder.id))],
            materials: [...saved.materials, ...teamFolderDemoMaterials.filter((material) => !saved.materials.some((item) => item.id === material.id))],
            folderAssignments: { ...initialTeamFolderAssignments, ...saved.folderAssignments },
          }
          window.localStorage.setItem(key, JSON.stringify(snapshot))
        }
      }
    } catch { /* Unavailable storage leaves the in-memory prototype usable. */ }
  }
  return snapshot
}
function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function useMaterialFolderState(field) {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initial)
  function setValue(value) {
    const current = getSnapshot()
    if (!field) {
      const next = typeof value === "function" ? value(current) : value
      // A whole-state operation must persist before notifying consumers.
      window.localStorage.setItem(key, JSON.stringify(next))
      snapshot = next
      listeners.forEach((listener) => listener())
      return
    }
    snapshot = { ...current, [field]: typeof value === "function" ? value(current[field]) : value }
    try { window.localStorage.setItem(key, JSON.stringify(snapshot)) } catch { /* Session state remains available. */ }
    listeners.forEach((listener) => listener())
  }
  return [field ? state[field] : state, setValue]
}
