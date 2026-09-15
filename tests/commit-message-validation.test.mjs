import test from "node:test"
import assert from "node:assert/strict"
import { validateCommitMessage } from "../scripts/validate-commit-message.mjs"

test("具体标题和多模块需求映射可通过校验", () => {
  const errors = validateCommitMessage(
    "feat: 新增商详焕新、多角度编辑与素材智能命名\n\n- 新增商详焕新原型与PRD导出\n- 补充素材智能命名与回归测试",
    { changedFileCount: 8 },
  )
  assert.deepEqual(errors, [])
})

test("拒绝依赖上下文的笼统标题", () => {
  const errors = validateCommitMessage("feat: 完成本期全部修改", { changedFileCount: 1 })
  assert.match(errors.join("\n"), /笼统表述/)
})

test("拒绝缺少提交类型的标题", () => {
  const errors = validateCommitMessage("新增素材智能命名", { changedFileCount: 1 })
  assert.match(errors.join("\n"), /type: 具体中文摘要/)
})

test("拒绝没有具体中文说明的标题", () => {
  const errors = validateCommitMessage("feat: add material naming", { changedFileCount: 1 })
  assert.match(errors.join("\n"), /必须包含具体中文说明/)
})

test("多文件提交必须列出至少两条需求映射", () => {
  const errors = validateCommitMessage("feat: 新增素材智能命名", { changedFileCount: 5 })
  assert.match(errors.join("\n"), /至少需要两条/)
})

test("单文件文档修订允许不写正文", () => {
  const errors = validateCommitMessage("docs: 补充提交说明约束", { changedFileCount: 1 })
  assert.deepEqual(errors, [])
})
