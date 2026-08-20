import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import test from "node:test"

const prototypeAssets = [
  {
    path: "public/prototypes/xianma-ai-canvas-v1.html",
    sha256: "cf2cdc726d6ddcd778764474dbf3da73ace565bbb920da3de838f8752f9214da",
  },
  {
    path: "public/prototypes/assets/project-logo.png",
    sha256: "43508050590c361b3f4d2dd69e24e6a884adc44386bb5fd3eccdd7a492b3ec44",
  },
]

for (const asset of prototypeAssets) {
  test(`${asset.path} remains byte-for-byte unchanged`, async () => {
    const content = await readFile(asset.path)
    const digest = createHash("sha256").update(content).digest("hex")

    assert.equal(digest, asset.sha256)
  })
}
