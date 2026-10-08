#!/usr/bin/env node
// PreToolUse guardrail hook (registered in .claude/settings.json). Reads the tool call as JSON on stdin.
// Exit 2 blocks the call and shows stderr to Claude; exit 0 lets it through.
import path from "node:path"

// Paths Claude may never modify (relative to the repo or worktree root).
const PROTECTED = [
  /^\.claude\/settings\.json$/,
  /^\.claude\/hooks\//,
  /^REVIEW\.md$/,
  /^scripts\/approve\.sh$/,
  /(^|\/)\.env(\.|$)/,
  /^sources\/.+\.(png|jpe?g|heic|webp|pdf)$/i,
]
const ENV_FILE = /(^|\/)\.env(\.|$)/

const ARTIFACT = /^docs\/changes\/[^/]+\/(intent|spec|plan)\.md$/
const APPROVAL = /^[ \t]*(status:[ \t]*approved|approved_by:[ \t]*[^\s#]|approved_at:[ \t]*[^\s#])/m
const DELEGATED = /^[ \t]*approved_by:.*delegated in chat/m

const TEST_FILE = /(^|\/)tests?\/|[._-](test|spec)\.[a-z]+$/
const TEST_SKIP =
  /\b(it|test|describe|suite)\.(skip|todo|only)\(|\bx(it|describe|test)\(|\{\s*(skip|todo|only)\s*:\s*(true|['"`])/

const EDIT_TOOLS = new Set(["Edit", "MultiEdit", "Write", "NotebookEdit"])

// Shell: a write (redirect or mutating command) whose target, in the same simple command, matches `target`.
// Heredoc bodies are stripped first so text that merely *mentions* a path is not mistaken for a write.
const SH_PROTECTED = String.raw`(\.claude/settings\.json|\.claude/hooks\b|REVIEW\.md|scripts/approve\.sh|\.env\b)`
const SH_ARTIFACT = String.raw`docs/changes/[^\s;&|]*/(intent|spec|plan)\.md`
const writesTo = (target) =>
  new RegExp(String.raw`(>>?\s*|\b(sed\s+-i|tee|mv|cp|rm|truncate|chmod|ln|install|dd)\b[^;&|\n]*?\s)['"]?[^\s;&|'"]*` + target)
const stripHeredocs = (cmd) => cmd.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, "<<HEREDOC")

const block = (msg) => {
  process.stderr.write(`Guardrail: ${msg}\n`)
  process.exit(2)
}

let raw = ""
for await (const chunk of process.stdin) raw += chunk
let call
try {
  call = JSON.parse(raw)
} catch {
  process.exit(0)
}
const tool = call.tool_name
const input = call.tool_input ?? {}
const root = process.env.CLAUDE_PROJECT_DIR || call.cwd || process.cwd()

// Repo-relative path; files inside .worktrees/<id>/ are treated as if at the root of that worktree.
const rel = (p) =>
  path.relative(root, path.resolve(call.cwd || root, p)).split(path.sep).join("/").replace(/^\.worktrees\/[^/]+\//, "")

if (tool === "Read" && input.file_path) {
  const f = rel(input.file_path)
  if (ENV_FILE.test(f) && !f.endsWith(".env.example")) block("reading .env files is blocked. Use .env.example.")
}

if (EDIT_TOOLS.has(tool)) {
  const file = rel(input.file_path ?? input.notebook_path ?? "")
  const text = [input.content, input.new_string, input.new_source, ...(input.edits ?? []).map((e) => e.new_string)]
    .filter((t) => typeof t === "string")
    .join("\n")

  if (PROTECTED.some((re) => re.test(file))) block(`${file} is protected. Ask the owner to change it.`)
  if (ARTIFACT.test(file) && APPROVAL.test(text) && !DELEGATED.test(text)) {
    block(
      `only the owner approves artifacts (./scripts/approve.sh). Leave status: draft in ${file}. ` +
        `If the owner delegated approval in chat, write status, approved_by (containing "delegated in chat") ` +
        `and approved_at in one edit.`,
    )
  }
  if (TEST_FILE.test(file) && TEST_SKIP.test(text)) {
    block(`adding skipped/todo/only tests in ${file} is blocked. Fix the code instead, or stop and explain to the owner.`)
  }
}

if (tool === "Bash" && typeof input.command === "string") {
  const full = input.command
  const cmd = stripHeredocs(full)
  if (writesTo(SH_PROTECTED).test(cmd)) block("modifying protected files via the shell is blocked.")
  if (writesTo(SH_ARTIFACT).test(cmd) && /(status:\s*approved|approved_by:\s*\S)/.test(full) && !/delegated in chat/.test(full)) {
    block("only the owner approves artifacts (./scripts/approve.sh).")
  }
  if (/approve\.sh(?!\s+--check\b)/.test(cmd)) {
    block("only the owner approves artifacts. You may run ./scripts/approve.sh --check <id> <stage>.")
  }
  if (/--no-verify\b/.test(cmd)) block("bypassing git hooks is blocked.")
  if (/git\s+push\b[^;&|\n]*(\s-f\b|--force)/.test(cmd)) block("force-push is blocked.")
}

process.exit(0)
