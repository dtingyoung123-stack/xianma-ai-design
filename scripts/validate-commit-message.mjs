import { execFileSync } from "node:child_process"
import { pathToFileURL } from "node:url"

const SUBJECT_PATTERN = /^(feat|fix|docs|refactor|test|chore|build|ci|perf|style|revert)(\([^)]+\))?:\s+(.+)$/
const VAGUE_SUBJECT_PATTERNS = [
  /本期(?:修改|更新|优化|开发)?/,
  /全部修改/,
  /相关(?:修改|更新|优化)/,
  /更新内容/,
  /功能优化$/,
]

export function validateCommitMessage(message, { changedFileCount = 0 } = {}) {
  const normalized = String(message).replace(/\r\n/g, "\n").trim()
  const lines = normalized.split("\n")
  const subject = lines[0] ?? ""
  const errors = []
  const match = subject.match(SUBJECT_PATTERN)

  if (!match) {
    errors.push("提交标题必须使用 `type: 具体中文摘要` 格式。")
  } else {
    const summary = match[3].trim()
    if (Array.from(summary).length < 4) {
      errors.push("提交标题需要说明具体模块和动作。")
    }
    if (!/[\u3400-\u9fff]/u.test(summary)) {
      errors.push("提交摘要必须包含具体中文说明。")
    }
    if (VAGUE_SUBJECT_PATTERNS.some((pattern) => pattern.test(summary))) {
      errors.push("提交标题包含依赖上下文的笼统表述，请改为具体模块和动作。")
    }
  }

  if (Array.from(subject).length > 72) {
    errors.push("提交标题不能超过 72 个字符。")
  }

  const bodyBullets = lines.slice(1).filter((line) => /^-\s+\S/.test(line))
  if (changedFileCount >= 5 && bodyBullets.length < 2) {
    errors.push("涉及 5 个及以上文件时，提交正文至少需要两条 `- ` 需求映射。")
  }

  return errors
}

function readHeadMessage() {
  return execFileSync("git", ["show", "-s", "--format=%B", "HEAD"], { encoding: "utf8" })
}

function countHeadFiles() {
  const output = execFileSync(
    "git",
    ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "HEAD"],
    { encoding: "utf8" },
  ).trim()
  return output ? output.split(/\r?\n/).length : 0
}

function main() {
  const changedFileCount = countHeadFiles()
  const errors = validateCommitMessage(readHeadMessage(), { changedFileCount })
  if (errors.length > 0) {
    console.error("提交说明校验失败：")
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }
  console.log(`提交说明校验通过（${changedFileCount} 个文件）。`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
