import test from "node:test"
import assert from "node:assert/strict"
import { applyMaterialBatch, canBatchSubmitMaterial } from "../src/lib/material-batch-prototype.mjs"

const user = { id: "owner" }
const make = (id, values = {}) => ({ id, title: id, scope: "personal", status: "active", ownerId: "owner", remark: `备注-${id}`, ...values })
const options = (action, values = {}) => ({ action, user, canReview: (_user, material) => material.ownerDepartmentId !== "outside", ...values })

test("批量提交保留独立素材和备注，已驳回项可重提，重复ID不重复处理", () => {
  const original = [make("a"), make("b", { status: "rejected", rejectionReason: "旧原因" }), make("other")]
  const result = applyMaterialBatch(original, ["a", "b", "a"], options("submit"))
  assert.equal(result.successCount, 2)
  assert.equal(result.materials[0].remark, "备注-a")
  assert.equal(result.materials[1].rejectionReason, "")
  assert.equal(result.materials[1].status, "pending")
  assert.equal(original[0].status, "active")
  assert.equal(result.materials[2], original[2])
})

test("批量提交拒绝他人、审批中、已发布和已删除素材，成功项仍保留", () => {
  const original = [make("ok"), make("other", { ownerId: "other" }), make("pending", { status: "pending" }), make("team", { scope: "team" })]
  const result = applyMaterialBatch(original, ["ok", "other", "pending", "team", "deleted"], options("submit"))
  assert.equal(result.successCount, 1)
  assert.equal(result.failures.length, 4)
  assert.equal(result.failures.at(-1).reason, "素材已不存在")
  assert.equal(canBatchSubmitMaterial(user, original[2]), false)
})

test("审批时重新检查状态和组织权限，公共审批不进入团队批量处理", () => {
  const original = [make("ok", { status: "pending" }), make("outside", { status: "pending", ownerDepartmentId: "outside" }), make("done", { scope: "team" }), make("public", { scope: "team", publicReviewStatus: "pending" })]
  const result = applyMaterialBatch(original, original.map((item) => item.id), options("approve", { organizationIds: ["org"] }))
  assert.equal(result.successCount, 1)
  assert.equal(result.failures.length, 3)
  assert.equal(result.materials[0].scope, "team")
  assert.deepEqual(result.materials[0].visibleOrgIds, ["org"])
  assert.equal(result.materials[3], original[3])
  const repeated = applyMaterialBatch(result.materials, ["ok"], options("approve", { organizationIds: ["org"] }))
  assert.equal(repeated.successCount, 0)
})

test("审批必填组织、驳回必填原因；批量驳回保留个人素材和原备注", () => {
  const original = [make("a", { status: "pending" }), make("b", { status: "pending" })]
  assert.equal(applyMaterialBatch(original, ["a"], options("approve")).successCount, 0)
  assert.equal(applyMaterialBatch(original, ["a"], options("reject", { reason: "  " })).successCount, 0)
  const result = applyMaterialBatch(original, ["a", "b"], options("reject", { reason: "  图片模糊  " }))
  assert.equal(result.successCount, 2)
  for (const material of result.materials) {
    assert.equal(material.scope, "personal")
    assert.equal(material.status, "rejected")
    assert.equal(material.rejectionReason, "图片模糊")
    assert.equal(material.remark, `备注-${material.id}`)
  }
})
