import assert from "node:assert/strict"
import { readFile, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import { GET } from "../src/app/api/materials-prd/route.js"

test("素材库导出完整本期 PRD，保留 UTF-8 正文与中文文件名", async () => {
  const response = await GET()
  const filename = "无限画布角色四视图PRD_261020.md"
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8")
  assert.equal(response.headers.get("Content-Disposition"), `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
  assert.equal(await response.text(), await readFile(new URL(`../docs/${filename}`, import.meta.url), "utf8"))
})

test("PRD 源文件缺失时明确返回 404，不下载错误正文", async () => {
  const previous = process.cwd()
  const directory = await mkdtemp(path.join(tmpdir(), "materials-prd-"))
  try {
    process.chdir(directory)
    const response = await GET()
    assert.equal(response.status, 404)
    assert.equal(response.headers.get("Content-Disposition"), null)
    assert.equal(await response.text(), "PRD 文件暂不可用")
  } finally {
    process.chdir(previous)
    await rm(directory, { recursive: true, force: true })
  }
})
