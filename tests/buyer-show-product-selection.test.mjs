import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { productCategoryOptions } from "../src/data/demo/products.js"

const pageSource = await readFile(new URL("../src/app/ai-hub/BuyerShowPage.jsx", import.meta.url), "utf8")

test("买家秀使用商品智库统一品类，并保留旧场景品类映射", () => {
  assert.match(pageSource, /productCategoryOptions\.includes\(name\)/)
  assert.match(pageSource, /护腰带:\s*"护具类"/)
  assert.match(pageSource, /双拉带护膝:\s*"护具类"/)
  assert.match(pageSource, /normalizeSceneLibrary\(clone\(defaultLibrary\)\)/)
  assert.deepEqual(productCategoryOptions, ["通用", "医疗器械类", "大健康类", "宠物类", "护具类", "美妆类", "进口保健品类", "个护类", "地毯类"])
})

test("买家秀商品选择是独立可选入口，并记录商品版本快照", () => {
  assert.match(pageSource, /商品与场景/)
  assert.match(pageSource, /从商品智库选择商品/)
  assert.match(pageSource, /可单独选择/)
  assert.match(pageSource, /productRef:\s*selectedProduct\s*\?\s*\{/)
  assert.match(pageSource, /versionId:\s*selectedProduct\.versions\?\.at\(-1\)/)
})

test("场景管理不再创建第二套品类", () => {
  assert.match(pageSource, /平台品类统一由商品智库维护/)
  assert.doesNotMatch(pageSource, /新增品类.*onAddCat/)
})
