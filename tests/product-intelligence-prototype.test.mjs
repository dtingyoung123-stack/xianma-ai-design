import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  canAdjustProductScope,
  canCancelTeamProductSubmission,
  canArchiveProduct,
  canReviewProduct,
  canSubmitProductForTeam,
  canConfirmProduct,
  canDeleteProduct,
  canViewProduct,
  filterProducts,
  getProductDisplayStatusKey,
  transitionProduct,
} from "../src/lib/product-prototype.mjs"

const baseProduct = {
  id: "product-test",
  name: "测试商品",
  category: "护具类",
  scope: "mine",
  status: "pending_confirmation",
  ownerId: "demo-member",
  orgId: "org-product",
  visibleOrgIds: [],
  candidates: [
    { id: "a", status: "success" },
    { id: "b", status: "success" },
  ],
  versions: [],
  corrections: [],
}

test("member can only access owned personal products", () => {
  assert.equal(canViewProduct(baseProduct, "member"), true)
  assert.equal(canViewProduct({ ...baseProduct, ownerId: "another-user" }, "member"), false)
  assert.equal(canViewProduct({ ...baseProduct, ownerId: "another-user", scope: "public", status: "confirmed" }, "member"), true)
  assert.equal(canViewProduct({ ...baseProduct, ownerId: "another-user", scope: "team", visibleOrgIds: ["org-other"], publicReviewStatus: "approved", status: "confirmed" }, "member"), true)
})

test("product management permissions remain separate from visibility", () => {
  const teamProduct = { ...baseProduct, scope: "team", visibleOrgIds: ["org-product"] }
  assert.equal(canAdjustProductScope(teamProduct, "member"), false)
  assert.equal(canAdjustProductScope(teamProduct, "department_admin"), true)
  assert.equal(canArchiveProduct(teamProduct, "department_admin"), true)
  assert.equal(canArchiveProduct({ ...teamProduct, scope: "public" }, "department_admin"), false)
  assert.equal(canArchiveProduct({ ...teamProduct, scope: "public" }, "system_admin"), true)
})

test("confirming a candidate keeps the product personal until team approval", () => {
  assert.equal(canConfirmProduct(baseProduct, "member"), true)
  const confirmed = transitionProduct(baseProduct, "confirm", { candidateId: "b", at: "2026-09-02 16:42" })
  assert.equal(confirmed.id, baseProduct.id)
  assert.equal(confirmed.status, "confirmed")
  assert.equal(confirmed.scope, "mine")
  assert.deepEqual(confirmed.visibleOrgIds, [])
  assert.equal(confirmed.candidates.find((candidate) => candidate.id === "b").selected, true)
  assert.equal(confirmed.versions.length, 1)
  assert.equal(canSubmitProductForTeam(confirmed, "member"), true)
  const pending = transitionProduct(confirmed, "submit_team", { at: "2026-09-02 16:44" })
  assert.equal(pending.teamReviewStatus, "pending")
  assert.equal(canCancelTeamProductSubmission(pending, "member"), true)
  assert.equal(canReviewProduct(pending, "department_admin"), true)
  const approved = transitionProduct(pending, "approve_team", { visibleOrgIds: ["org-product"], at: "2026-09-02 16:45" })
  assert.equal(approved.scope, "team")
  assert.equal(approved.teamReviewStatus, "approved")
  assert.deepEqual(approved.visibleOrgIds, ["org-product"])
})

test("correction preserves the record and returns the product to restoration", () => {
  const correction = { id: "correction-1", types: ["结构"], note: "固定带位置不一致" }
  const next = transitionProduct(baseProduct, "correction", { correction, at: "2026-09-02 16:43" })
  assert.equal(next.status, "restoring")
  assert.deepEqual(next.corrections, [correction])
  assert.equal(next.candidates.length, 2)
})

test("generated output remains pending confirmation until an operator confirms", () => {
  assert.equal(getProductDisplayStatusKey("draft"), "needs_completion")
  assert.equal(getProductDisplayStatusKey("information_review"), "needs_completion")
  assert.equal(getProductDisplayStatusKey("needs_information"), "needs_completion")
  assert.equal(getProductDisplayStatusKey("import_failed"), "needs_completion")
  assert.equal(getProductDisplayStatusKey("recognizing"), "processing")
  assert.equal(getProductDisplayStatusKey("pending_confirmation"), "pending_confirmation")
  assert.equal(getProductDisplayStatusKey("partial_success"), "pending_confirmation")
  assert.equal(getProductDisplayStatusKey("restoring"), "processing")
  assert.equal(getProductDisplayStatusKey("confirmed"), "available")
  assert.equal(getProductDisplayStatusKey("confirmed", "", "", "mine"), "confirmed_personal")
  assert.equal(getProductDisplayStatusKey("confirmed", "pending", "", "mine"), "team_pending")
  assert.equal(getProductDisplayStatusKey("confirmed", "approved", "pending", "team"), "public_pending")
  assert.equal(getProductDisplayStatusKey("revising"), "revising")
  assert.equal(getProductDisplayStatusKey("archived"), "archived")
})

test("only unused personal unpublished products can be deleted", () => {
  assert.equal(canDeleteProduct({ ...baseProduct, scope: "mine" }, "member"), true)
  assert.equal(canDeleteProduct({ ...baseProduct, scope: "mine", usageRefs: [{ id: "task-1" }] }, "member"), false)
  assert.equal(canDeleteProduct({ ...baseProduct, scope: "team", ownerId: "demo-member" }, "member"), false)
  assert.equal(canDeleteProduct({ ...baseProduct, scope: "mine", status: "restoring" }, "member"), false)
  assert.equal(canDeleteProduct({ ...baseProduct, scope: "mine", ownerId: "another-user" }, "member"), false)
})

test("library filtering respects scope, query, category, and status", () => {
  const products = [
    baseProduct,
    { ...baseProduct, id: "team", name: "团队商品", scope: "team", status: "confirmed", visibleOrgIds: ["org-product"] },
    { ...baseProduct, id: "public", name: "公共商品", scope: "public", status: "confirmed", ownerId: "demo-system" },
  ]
  assert.deepEqual(filterProducts(products, { scope: "team", role: "member" }).map((product) => product.id), ["team"])
  assert.deepEqual(filterProducts(products, { scope: "public", role: "member", query: "公共", category: "护具类", status: "available" }).map((product) => product.id), ["public"])
  assert.deepEqual(filterProducts([
    { ...baseProduct, id: "draft", status: "draft" },
    { ...baseProduct, id: "pending", status: "pending_confirmation" },
    { ...baseProduct, id: "processing", status: "restoring" },
  ], { scope: "mine", role: "member", status: "needs_completion" }).map((product) => product.id), ["draft"])
  assert.deepEqual(filterProducts([
    { ...baseProduct, id: "pending", status: "pending_confirmation" },
    { ...baseProduct, id: "partial", status: "partial_success" },
  ], { scope: "mine", role: "member", status: "pending_confirmation" }).map((product) => product.id), ["pending", "partial"])
})

test("navigation and all three product routes are registered", async () => {
  const navigation = await readFile(new URL("../src/config/navigation.js", import.meta.url), "utf8")
  const listPage = await readFile(new URL("../src/app/products/page.js", import.meta.url), "utf8")
  const productPrdRoute = await readFile(new URL("../src/app/api/products-prd/route.js", import.meta.url), "utf8")
  const learningPage = await readFile(new URL("../src/app/products/new/page.js", import.meta.url), "utf8")
  const detailPage = await readFile(new URL("../src/app/products/[id]/page.js", import.meta.url), "utf8")
  assert.match(navigation, /商品智库/)
  assert.doesNotMatch(navigation, /AI 商品智库/)
  assert.match(navigation, /\/products\/new/)
  assert.match(navigation, /\/products\/\[id\]/)
  assert.match(listPage, /ProductLibraryClient/)
  assert.match(listPage, /\/api\/products-prd/)
  assert.match(listPage, /导出 PRD/)
  assert.match(productPrdRoute, /商品智库MVP_PRD_260904\.md/)
  assert.match(productPrdRoute, /text\/markdown; charset=utf-8/)
  assert.match(learningPage, /ProductLearningClient/)
  assert.match(detailPage, /ProductDetailClient/)
})

test("product role switch and PRD export remain prototype-only boundaries", async () => {
  const prd = await readFile(new URL("../docs/商品智库MVP_PRD_260904.md", import.meta.url), "utf8")
  const libraryPage = await readFile(new URL("../src/app/products/ProductLibraryClient.jsx", import.meta.url), "utf8")
  assert.match(libraryPage, /ProductRoleSwitch/)
  assert.match(prd, /原型中的角色切换控件和 URL `\?role=` 参数仅用于模拟不同角色视角/)
  assert.match(prd, /原型标题区“导出 PRD”仅为开发和评审下载当前 Markdown 的辅助入口/)
})

test("product learning keeps optional description and multi-angle guidance in the MVP flow", async () => {
  const learningClient = await readFile(new URL("../src/app/products/new/ProductLearningClient.jsx", import.meta.url), "utf8")
  assert.equal((learningClient.match(/商品参数与补充描述/g) || []).length, 2)
  assert.match(learningClient, /图片上传建议（选填）/)
  assert.match(learningClient, /正面 \/ 背面 \/ 侧面/)
  assert.match(learningClient, /缺少某个角度也可以继续/)
  assert.match(learningClient, /notes,/)
  assert.match(learningClient, /initialProduct\?\.notes \|\| ""/)
  assert.doesNotMatch(learningClient, /商品参数与补充描述 <span[^>]*>（选填）/)
  assert.match(learningClient, /正面：新中式丝质款面料（有丝质的光泽感）\\n背面：珊瑚绒亲肤面料\\n尺寸：120cm\*28cm/)
})

test("product learning uses a single flow panel and embeds output stages", async () => {
  const learningClient = await readFile(new URL("../src/app/products/new/ProductLearningClient.jsx", import.meta.url), "utf8")
  const imageQueue = await readFile(new URL("../src/components/workbench/ImageQueueModule.jsx", import.meta.url), "utf8")
  assert.match(learningClient, /columns=\{step === 1 \? "minmax\(0, 1\.1fr\) minmax\(320px, 0\.9fr\)" : "minmax\(0, 1fr\)"\}/)
  assert.match(learningClient, /step === 1 && <WorkbenchPanel>/)
  assert.match(learningClient, /图片证据与资料覆盖/)
  assert.match(learningClient, /step === 3 && <WorkbenchModule title=\{getOutputTitle\(step\)\}/)
  assert.match(learningClient, /step === 4 && <WorkbenchModule title=\{getOutputTitle\(step\)\}/)
  assert.match(learningClient, /const inputLocked = taskStatus === "running" \|\| candidates\.length > 0/)
  assert.match(imageQueue, /readOnly = false/)
  assert.match(imageQueue, /disabled=\{full \|\| readOnly\}/)
})

test("product learning supports paste supplements and import replacement choice", async () => {
  const learningClient = await readFile(new URL("../src/app/products/new/ProductLearningClient.jsx", import.meta.url), "utf8")
  assert.match(learningClient, /event\.clipboardData\?\.items/)
  assert.match(learningClient, /handleImageFiles\(\[file\], "剪贴板"\)/)
  assert.match(learningClient, /uploadSub="点击选择或 Ctrl\+V 粘贴"/)
  assert.match(learningClient, /setImages\(\(current\) => \[\.\.\.current, \.\.\.importedImages\]/)
  assert.match(learningClient, /pendingImport/)
  assert.match(learningClient, /不替换，保留当前内容/)
  assert.match(learningClient, /替换当前内容/)
})
