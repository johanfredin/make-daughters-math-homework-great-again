import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const wf = readFileSync(new URL("../../.github/workflows/pages.yml", import.meta.url), "utf8")
const job = (name) => {
  const start = wf.indexOf(`\n  ${name}:\n`)
  assert.ok(start >= 0, `job ${name}`)
  const next = wf.slice(start + 1).search(/\n  \w[\w-]*:\n/)
  return next < 0 ? wf.slice(start) : wf.slice(start, start + 1 + next)
}

test("the build job stamps the version before uploading", () => {
  const build = job("build")
  const stamp = build.indexOf("node scripts/stamp-version.mjs site")
  assert.ok(stamp >= 0, "stamp step")
  assert.ok(stamp < build.indexOf("upload-pages-artifact"), "stamp before upload")
})

test("the deploy job refuses a commit that is not the tip of main", () => {
  const deploy = job("deploy")
  const guard = deploy.indexOf("git ls-remote")
  assert.ok(guard >= 0, "guard step")
  assert.match(deploy, /refs\/heads\/main/)
  assert.match(deploy, /"\$latest" != "\$GITHUB_SHA"/)
  assert.match(deploy, /exit 1/)
  assert.ok(guard < deploy.indexOf("deploy-pages"), "guard before deploy")
})
