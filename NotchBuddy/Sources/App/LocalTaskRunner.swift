import Foundation

// MARK: - LocalTaskRunner
// Coucou → Claude Code. Takes a job from the island, starts the user's `claude` CLI headless in
// the chosen folder, follows it through the same hooks Coucou already listens to, asks the user
// only for approvals / human-only steps, and decides "done" by running the project's checks.
//
//   TaskComposerView ─ start() ─► ClaudeProcess (claude -p --session-id <task> --settings runner hooks)
//   claude hooks ─► nb-hook runner ─► HookServer ─► handleHook() ─► delegate (island UI)
//
// Foundation only: the island glue lives in TaskRunnerBridge.swift.

enum ApprovalDecision: String, Sendable {
    case allow, always, deny, ask
}

struct RunnerApprovalRequest: Sendable, Equatable {
    let tool: String
    let command: String
    /// Set when SafetyGuard forced the approval. "Always allow" must not be offered then.
    let guardReason: String?
    /// "Always allow" persists a Claude Code permission rule; Codex hooks have no equivalent.
    var allowsAlways: Bool = true
}

struct TaskUpdate: Sendable {
    let session: TaskSession
    /// New line for the island ticker, if any.
    let step: String?
    /// Claude is using a browser / fetching the web (Mochi "searching").
    let browsing: Bool
}

@MainActor
protocol TaskRunnerDelegate: AnyObject {
    func taskRunner(didUpdate update: TaskUpdate)
    func taskRunner(needsApproval request: RunnerApprovalRequest,
                    for session: TaskSession,
                    respond: @escaping @Sendable (ApprovalDecision) -> Void)
}

@MainActor
final class LocalTaskRunner {
    struct Config {
        var supportDir: URL
        /// Hook command line for runner sessions, e.g. `"…/NotchBuddy/nb-hook" runner`.
        var hookCommand: String
        var permissionMode: String = "acceptEdits"
        var useChrome: Bool = false
        var maxVerifyRounds: Int = 3
        var claudePathOverride: String? = nil
        var codexPathOverride: String? = nil
        /// Seconds without any hook before warning that hooks don't reach Coucou.
        var hookWatchdog: TimeInterval = 45
    }

    enum RunnerError: LocalizedError {
        case claudeNotFound, codexNotFound, noSessionToResume, notFound, alreadyRunning, emptyPrompt, badFolder(String)
        var errorDescription: String? {
            switch self {
            case .claudeNotFound: return "Claude Code CLI（claude）が見つかりません。インストールしてログインしてください。"
            case .codexNotFound:  return "Codex CLI（codex）が見つかりません。インストールして ChatGPT でログインしてください。"
            case .noSessionToResume: return "再開できる Codex のセッションがありません。新しく依頼してください。"
            case .notFound:       return "タスクが見つかりません。"
            case .alreadyRunning: return "このタスクはまだ実行中です。"
            case .emptyPrompt:    return "依頼内容を入力してください。"
            case .badFolder(let p): return "フォルダが見つかりません: \(p)"
            }
        }
    }

    private enum Outcome {
        case completed(verified: Bool, summary: String?)
        case waitingHuman(String)
        case failed(String)
    }

    let store: TaskStore
    var config: Config
    weak var delegate: TaskRunnerDelegate?

    private var processes: [UUID: ClaudeProcess] = [:]
    private var outcomes: [UUID: Outcome] = [:]
    private var results: [UUID: (text: String?, isError: Bool)] = [:]
    private var hookSeen: Set<UUID> = []
    private var pendingApprovals: [UUID: (task: UUID, respond: @Sendable (ApprovalDecision) -> Void)] = [:]

    init(store: TaskStore, config: Config) {
        self.store = store
        self.config = config
    }

    // MARK: - Public API

    var sessions: [TaskSession] { store.sessions }

    func isRunning(_ id: UUID) -> Bool { processes[id] != nil }

    /// Path of the CLI for `engine`, or the matching error.
    func cliPath(for engine: TaskEngine) throws -> String {
        switch engine {
        case .claude:
            guard let p = ClaudeProcess.locateClaude(override: config.claudePathOverride) else { throw RunnerError.claudeNotFound }
            return p
        case .codex:
            guard let p = ClaudeProcess.locateCodex(override: config.codexPathOverride) else { throw RunnerError.codexNotFound }
            return p
        }
    }

    @discardableResult
    func start(prompt: String, cwd: String, engine: TaskEngine = .claude) throws -> TaskSession {
        let goal = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !goal.isEmpty else { throw RunnerError.emptyPrompt }
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: cwd, isDirectory: &isDir), isDir.boolValue else {
            throw RunnerError.badFolder(cwd)
        }
        let cli = try cliPath(for: engine)
        var s = TaskSession(prompt: goal, cwd: cwd, status: .starting, engine: engine)
        // Claude Code takes our id (--session-id); Codex reports its thread id once started.
        s.claudeSessionId = engine == .claude ? s.idString : nil
        store.upsert(s)
        store.noteProject(cwd)
        notify(s, step: "依頼: \(goal.prefix(50))")
        do {
            try launch(s.id, cli: cli, resume: false, input: TaskPrompt.build(goal: goal))
        } catch {
            finish(s.id, status: .failed, detail: error.localizedDescription)
            throw error
        }
        return store.session(id: s.id) ?? s
    }

    /// Continues a task that is waiting for the user, finished, or failed, in the same Claude session.
    func resume(id: UUID, message: String) throws {
        guard var s = store.session(id: id) else { throw RunnerError.notFound }
        guard processes[id] == nil else { throw RunnerError.alreadyRunning }
        let cli = try cliPath(for: s.engineKind)
        if s.engineKind == .codex && s.claudeSessionId == nil { throw RunnerError.noSessionToResume }
        let text = message.trimmingCharacters(in: .whitespacesAndNewlines)
        s.status = .starting
        s.verifyRounds = 0
        s.detail = nil
        s.verified = nil
        s.finishedAt = nil
        store.upsert(s)
        notify(s, step: "↩︎ \(text.isEmpty ? "再開" : String(text.prefix(50)))")
        do {
            try launch(id, cli: cli, resume: true,
                       input: TaskPrompt.followUp(text.isEmpty ? "対応しました。作業を再開してください。" : text))
        } catch {
            finish(id, status: .failed, detail: error.localizedDescription)
            throw error
        }
    }

    func cancel(id: UUID) {
        guard var s = store.session(id: id), !s.status.isTerminal else { return }
        s.status = .cancelled
        s.finishedAt = Date()
        s.detail = "ユーザーが停止しました。"
        store.upsert(s)
        for (token, pending) in pendingApprovals where pending.task == id {
            pendingApprovals[token] = nil
            pending.respond(.deny)
        }
        processes[id]?.stop()
        notify(s, step: "■ 停止")
    }

    // MARK: - Launch

    private func launch(_ id: UUID, cli: String, resume: Bool, input: String) throws {
        guard var s = store.session(id: id) else { throw RunnerError.notFound }
        let path = ClaudeProcess.loginShellPATH()
        let args: [String]
        switch s.engineKind {
        case .claude:
            let settingsURL = try writeRunnerSettings()
            args = ClaudeProcess.arguments(sessionId: s.claudeSessionId ?? s.idString,
                                           resume: resume,
                                           settingsPath: settingsURL.path,
                                           permissionMode: config.permissionMode,
                                           chrome: config.useChrome)
        case .codex:
            // Hooks come from ~/.codex/hooks.json (CodexSetup), trusted once by the user.
            args = ClaudeProcess.codexArguments(resumeThread: resume ? s.claudeSessionId : nil, cwd: s.cwd)
        }
        let env = ClaudeProcess.environment(base: ProcessInfo.processInfo.environment,
                                            taskId: s.idString, path: path)
        let proc = ClaudeProcess(
            executable: cli, arguments: args, cwd: s.cwd, environment: env,
            logURL: logURL(for: id),
            onLine: { [weak self] line in
                guard let event = Self.parseStreamLine(line) else { return }
                Task { @MainActor in self?.handleStream(id, event) }
            },
            onExit: { [weak self] code in
                Task { @MainActor in self?.processExited(id, code: code) }
            })
        outcomes[id] = nil
        results[id] = nil
        hookSeen.remove(id)
        try proc.start(prompt: input)
        processes[id] = proc
        s.pid = proc.pid
        s.status = .starting
        store.upsert(s)
        notify(s, step: nil)
        scheduleHookWatchdog(id, pid: proc.pid)
    }

    func logURL(for id: UUID) -> URL {
        config.supportDir.appendingPathComponent("tasks/\(id.uuidString.lowercased()).log")
    }

    /// Hooks for runner sessions only, passed with `--settings` (the user's settings.json is untouched).
    /// Blocking events get long timeouts: the user may take a while to approve, verification runs builds.
    private func writeRunnerSettings() throws -> URL {
        let events: [(String, Int)] = [
            ("SessionStart", 10), ("SessionEnd", 10), ("UserPromptSubmit", 10),
            ("PreToolUse", 3600), ("PostToolUse", 10), ("PostToolUseFailure", 10),
            ("PermissionRequest", 3600), ("Notification", 10),
            ("Stop", 3600), ("StopFailure", 10),
            ("SubagentStart", 10), ("SubagentStop", 10),
        ]
        var hooks: [String: Any] = [:]
        for (event, timeout) in events {
            hooks[event] = [["hooks": [["type": "command", "command": config.hookCommand, "timeout": timeout]]]]
        }
        let data = try JSONSerialization.data(withJSONObject: ["hooks": hooks], options: [.prettyPrinted, .sortedKeys])
        try FileManager.default.createDirectory(at: config.supportDir, withIntermediateDirectories: true)
        let url = config.supportDir.appendingPathComponent("runner-settings.json")
        try data.write(to: url, options: .atomic)
        return url
    }

    private func scheduleHookWatchdog(_ id: UUID, pid: Int32) {
        let delay = config.hookWatchdog
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            guard let self, let proc = self.processes[id], proc.pid == pid,
                  !self.hookSeen.contains(id), let s = self.store.session(id: id) else { return }
            self.notify(s, step: "⚠ Hook が届いていません（python3 / Xcode Command Line Tools を確認）")
        }
    }

    // MARK: - stream-json (stdout)

    struct StreamEvent: Sendable {
        enum Kind: Sendable { case result, assistantText, sessionId }
        let kind: Kind
        let text: String?
        let isError: Bool
    }

    nonisolated static func parseStreamLine(_ line: String) -> StreamEvent? {
        guard let data = line.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return nil }
        switch type {
        // Codex (`codex exec --json`)
        case "thread.started":
            return StreamEvent(kind: .sessionId, text: json["thread_id"] as? String, isError: false)
        case "item.completed":
            guard let item = json["item"] as? [String: Any], item["type"] as? String == "agent_message",
                  let text = item["text"] as? String, !text.isEmpty else { return nil }
            return StreamEvent(kind: .assistantText, text: text, isError: false)
        case "turn.failed":
            let err = (json["error"] as? [String: Any])?["message"] as? String
            return StreamEvent(kind: .result, text: err ?? "Codex のターンが失敗しました", isError: true)
        case "error":
            return StreamEvent(kind: .result, text: json["message"] as? String ?? "Codex エラー", isError: true)
        // Claude Code (`claude -p --output-format stream-json`)
        case "result":
            return StreamEvent(kind: .result, text: json["result"] as? String,
                               isError: json["is_error"] as? Bool ?? (json["subtype"] as? String != "success"))
        case "assistant":
            guard let message = json["message"] as? [String: Any],
                  let content = message["content"] as? [[String: Any]] else { return nil }
            let texts = content.compactMap { $0["type"] as? String == "text" ? $0["text"] as? String : nil }
            guard let last = texts.last, !last.isEmpty else { return nil }
            return StreamEvent(kind: .assistantText, text: last, isError: false)
        default:
            return nil
        }
    }

    private func handleStream(_ id: UUID, _ event: StreamEvent) {
        switch event.kind {
        case .sessionId:
            if var s = store.session(id: id), s.claudeSessionId == nil, let thread = event.text {
                s.claudeSessionId = thread
                store.upsert(s)
            }
        case .result:
            results[id] = (event.text, event.isError)
        case .assistantText:
            // Latest message wins: a later answer supersedes a transient error (Codex reconnects),
            // and Claude Code's final `result` event still arrives after its last message.
            results[id] = (event.text, false)
        }
    }

    // MARK: - Process exit

    private func processExited(_ id: UUID, code: Int32) {
        processes[id] = nil
        for (token, pending) in pendingApprovals where pending.task == id {
            pendingApprovals[token] = nil
            pending.respond(.deny)
        }
        guard let s = store.session(id: id) else { return }
        if s.status == .cancelled {
            var c = s
            c.pid = nil
            store.upsert(c)
            notify(c, step: nil)
            return
        }
        let result = results.removeValue(forKey: id)
        switch outcomes.removeValue(forKey: id) {
        case .waitingHuman(let reason):
            finish(id, status: .waitingHuman, detail: reason)
        case .failed(let reason):
            finish(id, status: .failed, detail: reason)
        case .completed(let verified, let summary):
            finish(id, status: .completed, detail: summary ?? TaskPrompt.summary(result?.text), verified: verified)
        case nil:
            // The Stop hook never answered (hooks not delivered, crash, API error…).
            if code == 0, result?.isError != true {
                if case .needsHuman(let reason) = TaskPrompt.parseMarker(result?.text) {
                    finish(id, status: .waitingHuman, detail: reason)
                } else {
                    finish(id, status: .completed, detail: TaskPrompt.summary(result?.text), verified: false)
                }
            } else {
                let why = TaskPrompt.summary(result?.text) ?? "\(s.engineKind.label) が終了コード \(code) で停止しました。"
                finish(id, status: .failed, detail: "\(why)\nログ: \(logURL(for: id).path)")
            }
        }
    }

    private func finish(_ id: UUID, status: TaskStatus, detail: String?, verified: Bool? = nil) {
        guard var s = store.session(id: id) else { return }
        s.status = status
        s.pid = nil
        s.detail = detail
        if let verified { s.verified = verified }
        s.finishedAt = status.isTerminal ? Date() : nil
        store.upsert(s)
        let step: String
        switch status {
        case .completed:    step = s.verified == true ? "✓ 完了（検証済み）" : "✓ 完了（自動検証なし）"
        case .waitingHuman: step = "🙋 \(detail ?? "対応が必要です")"
        case .failed:       step = "✗ \(detail?.components(separatedBy: "\n").first ?? "失敗")"
        default:            step = status.label
        }
        notify(s, step: step)
    }

    // MARK: - Hooks

    /// Called for every hook event whose payload carries `coucou_task_id`.
    /// `reply` must be called exactly once; for PreToolUse / PermissionRequest / Stop Claude Code
    /// is waiting on it.
    func handleHook(event: String, payload: [String: Any], reply: @escaping @Sendable (String) -> Void) {
        let ok = #"{"ok":true}"#
        guard let idStr = payload["coucou_task_id"] as? String,
              let id = UUID(uuidString: idStr),
              var s = store.session(id: id) else {
            reply(event == "PermissionRequest" ? #"{"permissionDecision":"ask"}"# : "{}")
            return
        }
        hookSeen.insert(id)

        if s.status == .cancelled {
            reply(event == "PreToolUse" || event == "PermissionRequest"
                  ? #"{"permissionDecision":"deny","reason":"Task cancelled from Coucou"}"# : "{}")
            return
        }

        let tool = payload["tool_name"] as? String ?? "Tool"
        let input = payload["tool_input"] as? [String: Any] ?? [:]

        switch event {
        case "SessionStart":
            if s.claudeSessionId == nil, let sid = payload["session_id"] as? String, !sid.isEmpty {
                s.claudeSessionId = sid
            }
            update(&s, .planning, step: "\(s.engineKind.label) 起動")

        case "UserPromptSubmit":
            update(&s, .planning, step: nil)

        case "PreToolUse":
            if let verdict = SafetyGuard.check(tool: tool, input: input) {
                update(&s, .waitingApproval, step: "⚠ 承認待ち: \(verdict.reason)")
                var req = RunnerApprovalRequest(tool: tool, command: Self.describe(tool: tool, input: input),
                                                guardReason: verdict.reason)
                req.allowsAlways = false
                askApproval(id, req) { decision in
                    switch decision {
                    case .allow, .always:
                        reply(#"{"permissionDecision":"allow"}"#)
                    case .deny, .ask:
                        reply(#"{"permissionDecision":"deny","reason":"ユーザーが Coucou で拒否しました。この操作は行わずに続けてください。"}"#)
                    }
                }
                return
            }
            reply("{}")
            let status: TaskStatus = Self.isVerificationCommand(tool: tool, input: input) ? .verifying : .working
            update(&s, status, step: Self.stepLabel(tool: tool, input: input),
                   browsing: Self.isBrowsing(tool: tool, input: input))
            return

        case "PermissionRequest":
            let verdict = SafetyGuard.check(tool: tool, input: input)
            update(&s, .waitingApproval, step: "承認待ち: \(Self.stepLabel(tool: tool, input: input))")
            let canAlways = verdict == nil && s.engineKind == .claude
            var req = RunnerApprovalRequest(tool: tool, command: Self.describe(tool: tool, input: input),
                                            guardReason: verdict?.reason)
            req.allowsAlways = canAlways
            askApproval(id, req) { decision in
                // "always" lets Claude Code store the rule (permission_suggestions) — never for guarded ops,
                // and Codex PermissionRequest hooks fail closed on updatedPermissions.
                let d: ApprovalDecision = (decision == .always && !canAlways) ? .allow : decision
                reply(#"{"permissionDecision":"\#(d.rawValue)"}"#)
            }
            return

        case "PostToolUse":
            if s.status == .waitingApproval { update(&s, .working, step: nil) }

        case "PostToolUseFailure":
            notify(s, step: "⚠ 失敗: \(Self.stepLabel(tool: tool, input: input))")

        case "Notification":
            if let message = payload["message"] as? String, !message.isEmpty {
                notify(s, step: String(message.prefix(60)))
            }

        case "Stop":
            handleStop(id, payload: payload, reply: reply)
            return

        case "StopFailure":
            let error = (payload["error"] as? String) ?? (payload["message"] as? String) ?? "API エラー"
            outcomes[id] = .failed("\(s.engineKind.label) が停止しました: \(error)")

        case "SubagentStart":
            notify(s, step: "+ サブエージェント")

        case "SubagentStop":
            notify(s, step: "• サブエージェント完了")

        default:
            break
        }
        reply(ok)
    }

    // MARK: - Finish loop

    private func handleStop(_ id: UUID, payload: [String: Any], reply: @escaping @Sendable (String) -> Void) {
        guard var s = store.session(id: id) else { reply("{}"); return }
        let last = payload["last_assistant_message"] as? String

        if case .needsHuman(let reason) = TaskPrompt.parseMarker(last) {
            outcomes[id] = .waitingHuman(reason)
            reply("{}")
            return
        }

        let steps = TaskVerifier.plan(cwd: s.cwd)
        guard !steps.isEmpty else {
            // Nothing Coucou can run itself: rely on Claude's own verification, flagged as such.
            outcomes[id] = .completed(verified: false, summary: TaskPrompt.summary(last))
            reply("{}")
            return
        }

        update(&s, .verifying, step: "検証: " + steps.map(\.name).joined(separator: " → "))
        let cwd = s.cwd
        let path = ClaudeProcess.loginShellPATH()
        Task { [weak self] in
            let result = await TaskVerifier.run(steps, cwd: cwd, path: path)
            guard let self else { reply("{}"); return }
            self.verificationFinished(id, result: result, last: last, reply: reply)
        }
    }

    private func verificationFinished(_ id: UUID, result: VerificationResult, last: String?,
                                      reply: @escaping @Sendable (String) -> Void) {
        guard var s = store.session(id: id), s.status != .cancelled else { reply("{}"); return }
        let names = result.ran.map(\.name).joined(separator: ", ")
        if result.passed {
            outcomes[id] = .completed(verified: true, summary: TaskPrompt.summary(last))
            notify(s, step: "✓ 検証OK（\(names)）")
            reply("{}")
            return
        }
        let failed = result.failedStep?.command ?? "?"
        s.verifyRounds += 1
        if s.verifyRounds > config.maxVerifyRounds {
            outcomes[id] = .failed("検証が \(config.maxVerifyRounds + 1) 回続けて失敗しました: \(failed)")
            store.upsert(s)
            notify(s, step: "✗ 検証失敗（上限）: \(failed)")
            reply("{}")
            return
        }
        update(&s, .working, step: "✗ \(failed) 失敗 → 修正を依頼（\(s.verifyRounds)/\(config.maxVerifyRounds)）")
        let reason = TaskVerifier.blockReason(result, round: s.verifyRounds, maxRounds: config.maxVerifyRounds)
        reply(Self.json(["decision": "block", "reason": reason]))
    }

    // MARK: - Approvals

    private func askApproval(_ id: UUID, _ request: RunnerApprovalRequest,
                             send: @escaping @Sendable (ApprovalDecision) -> Void) {
        guard let s = store.session(id: id), let delegate else { send(.deny); return }
        let token = UUID()
        let once = OnceFlag()
        let respond: @Sendable (ApprovalDecision) -> Void = { [weak self] decision in
            guard once.fire() else { return }
            send(decision)
            Task { @MainActor in self?.approvalAnswered(token: token, task: id, decision: decision) }
        }
        pendingApprovals[token] = (id, respond)
        delegate.taskRunner(needsApproval: request, for: s, respond: respond)
    }

    private func approvalAnswered(token: UUID, task id: UUID, decision: ApprovalDecision) {
        pendingApprovals[token] = nil
        guard var s = store.session(id: id), s.status == .waitingApproval else { return }
        let still = pendingApprovals.values.contains { $0.task == id }
        update(&s, still ? .waitingApproval : .working,
               step: decision == .deny || decision == .ask ? "✗ 拒否" : "✓ 許可")
    }

    // MARK: - Helpers

    private func update(_ s: inout TaskSession, _ status: TaskStatus, step: String?, browsing: Bool = false) {
        if !s.status.isTerminal { s.status = status }
        store.upsert(s)
        notify(s, step: step, browsing: browsing)
    }

    private func notify(_ s: TaskSession, step: String?, browsing: Bool = false) {
        delegate?.taskRunner(didUpdate: TaskUpdate(session: s, step: step, browsing: browsing))
    }

    nonisolated static func json(_ dict: [String: String]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let s = String(data: data, encoding: .utf8) else { return "{}" }
        return s
    }

    nonisolated static func describe(tool: String, input: [String: Any]) -> String {
        if let cmd = input["command"] as? String { return cmd }
        if let file = input["file_path"] as? String { return "\(tool) \(file)" }
        if let url = input["url"] as? String { return "\(tool) \(url)" }
        if let data = try? JSONSerialization.data(withJSONObject: input, options: [.sortedKeys]),
           let s = String(data: data, encoding: .utf8), s != "{}" {
            return "\(tool) \(s.prefix(160))"
        }
        return tool
    }

    nonisolated static func stepLabel(tool: String, input: [String: Any]) -> String {
        let labels: [String: String] = [
            "Bash": "実行", "Read": "読む", "Write": "書く", "Edit": "編集", "MultiEdit": "編集",
            "Glob": "検索", "Grep": "検索", "WebSearch": "Web検索", "WebFetch": "取得",
            "TodoWrite": "計画", "Task": "サブエージェント", "Agent": "サブエージェント",
            "LS": "一覧", "NotebookEdit": "ノート編集",
        ]
        let label = labels[tool] ?? (isBrowserTool(tool) ? "ブラウザ" : tool.components(separatedBy: "__").last ?? tool)
        if let cmd = input["command"] as? String { return "\(label) · \(cmd.prefix(40))" }
        if let p = (input["file_path"] as? String) ?? (input["path"] as? String) {
            return "\(label) · \(URL(fileURLWithPath: p).lastPathComponent)"
        }
        if let q = (input["query"] as? String) ?? (input["pattern"] as? String) ?? (input["url"] as? String) {
            return "\(label) · \(q.prefix(40))"
        }
        return label
    }

    nonisolated static func isBrowserTool(_ tool: String) -> Bool {
        let t = tool.lowercased()
        return ["chrome", "browser", "playwright", "puppeteer"].contains { t.contains($0) }
    }

    nonisolated static func isBrowsing(tool: String, input: [String: Any]) -> Bool {
        if isBrowserTool(tool) || tool == "WebFetch" || tool == "WebSearch" { return true }
        if tool == "Bash", let cmd = (input["command"] as? String)?.lowercased() {
            return cmd.contains("playwright") || cmd.contains("puppeteer")
        }
        return false
    }

    nonisolated static func isVerificationCommand(tool: String, input: [String: Any]) -> Bool {
        guard tool == "Bash", let cmd = input["command"] as? String else { return false }
        let pattern = #"\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|lint|build|typecheck|type-check|check)\b|\b(tsc|jest|vitest|pytest|eslint|xcodebuild)\b|\bswift\s+(build|test)\b|\bcargo\s+(build|test|check|clippy)\b|\bgo\s+(build|test|vet)\b"#
        return cmd.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
    }
}

/// True only for the first call — guarantees a hook gets exactly one answer.
final class OnceFlag: @unchecked Sendable {
    private let lock = NSLock()
    private var fired = false
    func fire() -> Bool {
        lock.withLock {
            if fired { return false }
            fired = true
            return true
        }
    }
}
