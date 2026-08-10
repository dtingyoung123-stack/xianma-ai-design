import { readFile } from "node:fs/promises"
import path from "node:path"

const PRD_FILE = "素材库提示词库权限管理PRD_260810.md"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "docs", PRD_FILE)
    const content = await readFile(filePath, "utf-8")

    return new Response(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(PRD_FILE)}`,
      },
    })
  } catch {
    return new Response("PRD 文件暂不可用", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
