import { readFile } from "node:fs/promises"
import path from "node:path"

const SPEC_FILE = "前端UI规范与需求说明-V1.md"

export async function GET() {
  const filePath = path.join(process.cwd(), "docs", SPEC_FILE)
  const content = await readFile(filePath, "utf-8")
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(SPEC_FILE)}`,
    },
  })
}
