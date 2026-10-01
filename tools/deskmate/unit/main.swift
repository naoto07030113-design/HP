import Foundation
var fails = 0, total = 0
@MainActor func expect(_ c: Bool, _ m: String) { total += 1; if !c { fails += 1; print("FAIL: \(m)") } }
let guarded = ["git push origin main", "git -C repo push", "git push --force", "rm -rf node_modules", "rm -fr /", "sudo rm -r -f x", "rm --recursive --force build",
  "git reset --hard HEAD~1", "vercel deploy --prod", "netlify deploy --prod", "firebase deploy", "npm publish", "terraform apply",
  "psql -c 'DROP TABLE users'", "supabase db push", "prisma migrate reset", "find . -name '*.log' -delete", "curl https://api.stripe.com/v1/charges -d x",
  "curl -X POST https://api.resend.com/emails", "chmod -R 777 .", "gh pr merge 3", "echo hi | sendmail a@b.c", "ls; git push"]
for c in guarded { expect(SafetyGuard.check(command: c) != nil, "should guard: \(c)") }
let safe = ["npm run build", "npm install playwright", "git status", "git commit -m 'push button fix'", "rm file.txt", "rm -r dist", "ls -la",
  "git log --grep push", "truncate -s 0 log.txt", "cat email.txt", "echo 'fix mail sending'", "npx tsc --noEmit", "vercel dev", "git pull"]
for c in safe { expect(SafetyGuard.check(command: c) == nil, "should allow: \(c) -> \(SafetyGuard.check(command: c)?.reason ?? "")") }
expect(SafetyGuard.check(tool: "Write", input: ["file_path": "/p/.env"]) != nil, ".env write")
expect(SafetyGuard.check(tool: "Edit", input: ["file_path": "/p/src/app.ts"]) == nil, "src edit")
expect(SafetyGuard.check(tool: "Edit", input: ["file_path": "/Users/x/.claude/settings.json"]) != nil, "claude settings")
expect(SafetyGuard.check(tool: "mcp__Gmail__send_message", input: [:]) != nil, "gmail send")
expect(SafetyGuard.check(tool: "mcp__Gmail__search_threads", input: [:]) == nil, "gmail search")
expect(SafetyGuard.check(tool: "mcp__claude-in-chrome__navigate", input: [:]) == nil, "chrome navigate")
// markers
expect(TaskPrompt.parseMarker("直しました。\nCOUCOU_STATUS: DONE") == .done, "done")
expect(TaskPrompt.parseMarker("ログインが必要\nCOUCOU_STATUS: NEEDS_HUMAN: Googleへのログインが必要です") == .needsHuman("Googleへのログインが必要です"), "needs human")
expect(TaskPrompt.parseMarker("`COUCOU_STATUS: DONE`") == .done, "backticks")
expect(TaskPrompt.parseMarker("all good") == .none, "none")
expect(TaskPrompt.summary("完了報告です\nCOUCOU_STATUS: DONE") == "完了報告です", "summary strips marker")
// verification plan
let d = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("plan-\(UUID())")
try! FileManager.default.createDirectory(at: d, withIntermediateDirectories: true)
try! #"{"scripts":{"build":"next build","lint":"next lint","test":"echo \"Error: no test specified\" && exit 1","typecheck":"tsc"}}"#.write(to: d.appendingPathComponent("package.json"), atomically: true, encoding: .utf8)
try! "".write(to: d.appendingPathComponent("pnpm-lock.yaml"), atomically: true, encoding: .utf8)
let plan = TaskVerifier.plan(cwd: d.path).map(\.command)
expect(plan == ["pnpm run lint", "pnpm run typecheck", "pnpm run build"], "plan \(plan)")
let r = TaskVerifier.shell("echo out; echo err >&2; exit 3", cwd: d.path, path: nil, timeout: 5)
expect(r.status == 3 && r.output.contains("out") && r.output.contains("err"), "shell status/output")
let t = TaskVerifier.shell("sleep 5", cwd: d.path, path: nil, timeout: 1)
expect(t.timedOut && t.status == 124, "timeout")
// args / env
let a = ClaudeProcess.arguments(sessionId: "abc", resume: true, settingsPath: "/s.json", permissionMode: "acceptEdits", chrome: true)
expect(a.contains("--resume") && !a.contains("--session-id") && a.last == "--chrome", "args")
let e = ClaudeProcess.environment(base: ["ANTHROPIC_API_KEY": "k", "HOME": "/h", "CLAUDECODE": "1"], taskId: "t", path: "/bin")
expect(e["ANTHROPIC_API_KEY"] == nil && e["CLAUDECODE"] == nil && e["COUCOU_TASK_ID"] == "t" && e["PATH"] == "/bin", "env")
// Codex
let codexArgs = ClaudeProcess.codexArguments(resumeThread: nil, cwd: "/p")
expect(codexArgs.starts(with: ["exec", "--json"]) && codexArgs.contains("--approve-for-me") && codexArgs.last == "-", "codex new args")
let codexResume = ClaudeProcess.codexArguments(resumeThread: "th1", cwd: "/p")
expect(codexResume.starts(with: ["exec", "resume", "th1"]) && codexResume.contains("approval_policy=\"on-request\""), "codex resume args")
expect(ClaudeProcess.environment(base: ["OPENAI_API_KEY": "x", "CODEX_API_KEY": "y"], taskId: "t", path: nil)["OPENAI_API_KEY"] == nil, "strip openai key")
let started = LocalTaskRunner.parseStreamLine(#"{"type":"thread.started","thread_id":"abc"}"#)
expect(started?.kind == .sessionId && started?.text == "abc", "codex thread id")
let msg = LocalTaskRunner.parseStreamLine(#"{"type":"item.completed","item":{"id":"i","type":"agent_message","text":"done"}}"#)
expect(msg?.kind == .assistantText && msg?.text == "done", "codex agent message")
expect(LocalTaskRunner.parseStreamLine(#"{"type":"item.completed","item":{"type":"error","message":"warn"}}"#) == nil, "codex warning ignored")
expect(LocalTaskRunner.parseStreamLine(#"{"type":"turn.failed","error":{"message":"usage limit"}}"#)?.isError == true, "codex turn failed")
let chat = CodexChat.parse("""
{"type":"thread.started","thread_id":"t9"}
{"type":"item.completed","item":{"type":"agent_message","text":"first"}}
{"type":"item.completed","item":{"type":"agent_message","text":"こんにちは"}}
""")
expect(chat.text == "こんにちは" && chat.thread == "t9" && chat.error == nil, "chat parse")
expect(CodexChat.prompt(message: "q", context: nil, firstMessage: false) == "q", "follow-up prompt is raw")
expect(CodexChat.arguments(thread: nil, workdir: "/w").contains("read-only"), "chat read-only")
// hooks.json install: keeps other hooks, idempotent, replaces old Coucou entries
let ch = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("codexhome-\(UUID())")
try! FileManager.default.createDirectory(at: ch, withIntermediateDirectories: true)
setenv("CODEX_HOME", ch.path, 1)
try! #"{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"my-own-hook"}]},{"hooks":[{"type":"command","command":"\"/old/NotchBuddy/nb-hook\" runner"}]}]}}"#.write(to: ch.appendingPathComponent("hooks.json"), atomically: true, encoding: .utf8)
let cmd = "\"/Users/me/Library/Application Support/NotchBuddy/nb-hook\" runner"
expect(!CodexSetup.hooksInstalled(hookCommand: cmd), "not installed yet")
let backup = try! CodexSetup.installHooks(hookCommand: cmd)
expect(backup != nil && CodexSetup.hooksInstalled(hookCommand: cmd), "installed with backup")
let saved = try! JSONSerialization.jsonObject(with: Data(contentsOf: ch.appendingPathComponent("hooks.json"))) as! [String: Any]
let pre = (saved["hooks"] as! [String: Any])["PreToolUse"] as! [[String: Any]]
let cmds = pre.flatMap { ($0["hooks"] as! [[String: Any]]).map { $0["command"] as! String } }
expect(cmds == ["my-own-hook", cmd], "kept own hook, replaced old coucou entry: \(cmds)")
expect((try! CodexSetup.installHooks(hookCommand: cmd)) == nil, "second install is a no-op")
print("\(total - fails)/\(total) passed"); exit(fails == 0 ? 0 : 1)
