import test from "node:test"
import assert from "node:assert/strict"
import { folderPath, descendantIds, validateFolder, canManageFolders, removeFolderTree, planFolderDeletion } from "../src/lib/material-folders.mjs"

const folders = [
  { id: "a", scope: "team", departmentId: "A", name: "商品", parentId: "" },
  { id: "b", scope: "team", departmentId: "A", name: "护腰", parentId: "a" },
  { id: "c", scope: "team", departmentId: "A", name: "实拍", parentId: "b" },
  { id: "d", scope: "team", departmentId: "B", name: "商品", parentId: "" },
]
test("parent filtering includes descendants without mixing departments", () => {
  assert.equal(folderPath(folders, "c"), "商品 / 护腰 / 实拍")
  assert.deepEqual(descendantIds(folders, "a"), ["a", "b", "c"])
})
test("three-level and sibling-name boundaries", () => {
  assert.match(validateFolder(folders, { ...folders[0], id: undefined, parentId: "c" }), /三层/)
  assert.match(validateFolder(folders, { ...folders[0], id: undefined }), /同名/)
  assert.equal(validateFolder(folders, { ...folders[0], id: undefined, departmentId: "C" }), "")
  assert.match(validateFolder(folders, { ...folders[0], id: undefined, parentId: "d" }), /当前范围/)
})
test("approval permission grants team-folder management only within assigned department", () => {
  const approver = { roleIds: ["approval_admin"], approvalTypeIds: ["material_publish"], organizationScopeIds: ["A"] }
  const inScope = (id, ids) => ids.includes(id)
  assert.equal(canManageFolders(approver, "team", "A", inScope), true)
  assert.equal(canManageFolders(approver, "team", "B", inScope), false)
  assert.equal(canManageFolders(approver, "public", "A", inScope), false)
  assert.equal(canManageFolders({ ...approver, roleIds: ["member"] }, "team", "A", inScope), false)
})
test("deleting a folder tree clears team membership but preserves personal/public assignments", () => {
  const assignments = { "team:one": "c", "team:two": "b", "public:one": "public-folder", "personal:one": "private-folder", "team:other": "d" }
  const result = removeFolderTree(folders, assignments, "a")
  assert.deepEqual(result.folders.map((item) => item.id), ["d"])
  assert.deepEqual(result.assignments, { "public:one": "public-folder", "personal:one": "private-folder", "team:other": "d" })
  assert.deepEqual(result.removedTeamIds, [])
  assert.deepEqual(removeFolderTree(folders, assignments, "a", true).affected, ["team:one", "team:two"])
})

function deletionState() {
  return {
    folders,
    folderAssignments: { "team:one": "b", "team:two": "c", "public:one": "public-folder" },
    materials: ["one", "two"].map((id) => ({ id, scope: "team", status: "active", ownerDepartmentId: "A" })),
    personalGroups: ["私人目录"],
    personalGroupAssignments: { one: "私人目录" },
    removedTeamIds: [],
  }
}

test("mixed deletion permission or changed state rejects the complete operation without mutation", () => {
  for (const change of [
    (state) => { state.materials[1].publicReviewStatus = "pending" },
    (state) => { state.materials[1].status = "pending" },
    (state) => { state.materials.pop() },
  ]) {
    const state = deletionState()
    change(state)
    const before = structuredClone(state)
    assert.throws(() => planFolderDeletion(state, "a", true, () => true), /变化/)
    assert.deepEqual(state, before)
  }
  const state = deletionState()
  const before = structuredClone(state)
  assert.throws(() => planFolderDeletion(state, "a", true, (material) => material.id !== "two"), /变化/)
  assert.deepEqual(state, before)
})

test("successful attached deletion removes only team projections and returns one complete next snapshot", () => {
  const state = deletionState()
  state.materials[0].publicReviewStatus = "approved"
  const before = structuredClone(state)
  const next = planFolderDeletion(state, "a", true, () => true)
  assert.deepEqual(state, before)
  assert.deepEqual(next.folders.map((folder) => folder.id), ["d"])
  assert.deepEqual(next.removedTeamIds, ["one", "two"])
  assert.deepEqual(next.folderAssignments, { "public:one": "public-folder" })
  assert.deepEqual(next.materials, state.materials)
  assert.deepEqual(next.personalGroupAssignments, state.personalGroupAssignments)
})

test("deleting only folders keeps team materials even when they are not deletable", () => {
  const state = deletionState()
  state.materials[0].publicReviewStatus = "pending"
  const next = planFolderDeletion(state, "a", false, () => false)
  assert.deepEqual(next.removedTeamIds, [])
  assert.deepEqual(next.materials, state.materials)
  assert.deepEqual(next.folderAssignments, { "public:one": "public-folder" })
})
