import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const files = {
  buyerShow: await readFile(new URL("../src/app/ai-hub/BuyerShowPage.jsx", import.meta.url), "utf8"),
  detailRefresh: await readFile(new URL("../src/app/ai-hub/DetailRefreshPage.jsx", import.meta.url), "utf8"),
  subjectReplace: await readFile(new URL("../src/app/image-tools/subject-replace/SubjectReplaceWorkbench.jsx", import.meta.url), "utf8"),
  picker: await readFile(new URL("../src/components/workbench/ProductPickerModal.jsx", import.meta.url), "utf8"),
}

test("三个工作台统一调用公共商品选择器", () => {
  assert.match(files.buyerShow, /ProductPickerModal/)
  assert.match(files.detailRefresh, /ProductPickerModal/)
  assert.match(files.subjectReplace, /ProductPickerModal/)
  assert.doesNotMatch(files.buyerShow, /function BuyerShowProductPicker/)
  assert.doesNotMatch(files.detailRefresh, /function ProductPicker\(/)
})

test("公共商品选择器统一品类、可见性和确认版本规则", () => {
  assert.match(files.picker, /productCategoryOptions/)
  assert.match(files.picker, /canViewProduct\(product, role, userId\)/)
  assert.match(files.picker, /hasValidProductConfirmation\(product\)/)
  assert.match(files.picker, /个人商品库/)
  assert.match(files.picker, /团队商品库/)
  assert.match(files.picker, /公共商品库/)
})

test("主体替换以商品作为独立替换主体来源，不固定参考图位置", () => {
  assert.match(files.subjectReplace, /const canSubmit = images\.length >= \(selectedProduct \? 1 : 2\)/)
  assert.match(files.subjectReplace, /将以该商品作为替换主体/)
  assert.doesNotMatch(files.subjectReplace, /确认图固定为第 2 张主体参考图/)
  assert.doesNotMatch(files.subjectReplace, /function withProductReference\(images, product\)/)
  assert.match(files.subjectReplace, /const productRef = productSnapshot\(selectedProduct\)/)
  assert.match(files.subjectReplace, /setTask\(\{ status: "completed"[\s\S]*productRef \}/)
})
