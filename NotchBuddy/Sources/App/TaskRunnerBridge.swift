import AppKit
import SwiftUI

// MARK: - TaskRunnerBridge
// Connects LocalTaskRunner to the island: one pill (and Mochi state) per task, approvals through
// the existing approval view, alerts through the existing finished / error / question views.

@MainActor
final class TaskRunnerBridge: ObservableObject, TaskRunnerDelegate {
    static let shared = TaskRunnerBridge()

    let runner: LocalTaskRunner

    /// Task the composer replies to (set by "返信" in the question / error views).
    @Published var replyTarget: UUID? = nil
    /// Last error from start/resume, shown in the composer.
    @Published var composerError: String? = nil
    /// Agent used for new tasks (composer switch), persisted.
    @Published var engine: TaskEngine = .claude {
        didSet { UserDefaults.standard.set(engine.rawValue, forKey: "runnerEngine") }
    }
    /// Codex needs Coucou's hook registered once: the composer asks before touching ~/.codex.
    @Published var codexSetupPrompt: Bool = false
    @Published var codexBusy: Bool = false
    private var pendingCodexJob: (prompt: String, cwd: String)? = nil
    /// Bumped on every runner update so views listing sessions refresh.
    @Published private(set) var revision: Int = 0

    private init() {
        let ud = UserDefaults.standard
        let hookPath = HookServer.hookScriptPath.replacingOccurrences(of: "\"", with: "\\\"")
        var config = LocalTaskRunner.Config(
            supportDir: HookServer.supportDir,
            hookCommand: "\"\(hookPath)\" runner")
        if let mode = ud.string(forKey: "runnerPermissionMode"), !mode.isEmpty { config.permissionMode = mode }
        if ud.object(forKey: "runnerUseChrome") != nil { config.useChrome = ud.bool(forKey: "runnerUseChrome") }
        if ud.object(forKey: "runnerMaxVerifyRounds") != nil { config.maxVerifyRounds = max(0, ud.integer(forKey: "runnerMaxVerifyRounds")) }
        config.claudePathOverride = ud.string(forKey: "claudeCLIPath")
        config.codexPathOverride = ud.string(forKey: "codexCLIPath")
        runner = LocalTaskRunner(store: TaskStore(directory: HookServer.supportDir), config: config)
        runner.delegate = self
        if let raw = ud.string(forKey: "runnerEngine"), let e = TaskEngine(rawValue: raw) { engine = e }
    }

    /// Called once at launch: brings back tasks that are still waiting for the user.
    func setup() {
        for s in runner.sessions where s.status == .waitingHuman {
            syncPill(s, step: "🙋 \(s.detail ?? "対応が必要です")", browsing: false)
        }
        // Resolve the login shell PATH off the main thread so the first task starts instantly.
        DispatchQueue.global(qos: .utility).async { _ = ClaudeProcess.loginShellPATH() }
    }

    var useChrome: Bool {
        get { runner.config.useChrome }
        set {
            runner.config.useChrome = newValue
            UserDefaults.standard.set(newValue, forKey: "runnerUseChrome")
            objectWillChange.send()
        }
    }

    // MARK: - Actions (from the island)

    func start(prompt: String, cwd: String) {
        composerError = nil
        if engine == .codex {
            startCodex(prompt: prompt, cwd: cwd)
        } else {
            launch(prompt: prompt, cwd: cwd, engine: .claude)
        }
    }

    private func launch(prompt: String, cwd: String, engine: TaskEngine) {
        do {
            let s = try runner.start(prompt: prompt, cwd: cwd, engine: engine)
            AppState.shared.focusId = s.agentTaskId
            AppState.shared.view = .overview
        } catch {
            composerError = error.localizedDescription
            SoundEngine.shared.play("error")
        }
    }

    // MARK: - Codex hook setup

    /// Codex runs only hooks the user trusted: check ours first (off the main thread, it spawns
    /// `codex app-server`), and ask before registering them.
    private func startCodex(prompt: String, cwd: String) {
        let codex: String
        do { codex = try runner.cliPath(for: .codex) } catch {
            composerError = error.localizedDescription
            SoundEngine.shared.play("error")
            return
        }
        let hook = runner.config.hookCommand
        codexBusy = true
        Task.detached {
            let status = CodexSetup.status(codex: codex, cwd: cwd, hookCommand: hook,
                                           path: ClaudeProcess.loginShellPATH())
            await MainActor.run {
                self.codexBusy = false
                switch status {
                case .ready:
                    self.launch(prompt: prompt, cwd: cwd, engine: .codex)
                case .notInstalled, .untrusted:
                    self.pendingCodexJob = (prompt, cwd)
                    self.codexSetupPrompt = true
                case .unavailable(let message):
                    self.composerError = "Codex を確認できません: \(message)"
                }
            }
        }
    }

    /// "登録して開始": adds the hook to ~/.codex/hooks.json (backup kept), trusts it, starts the job.
    func confirmCodexSetup() {
        guard let job = pendingCodexJob else { codexSetupPrompt = false; return }
        let codex: String
        do { codex = try runner.cliPath(for: .codex) } catch {
            composerError = error.localizedDescription
            return
        }
        let hook = runner.config.hookCommand
        codexSetupPrompt = false
        codexBusy = true
        Task.detached {
            let path = ClaudeProcess.loginShellPATH()
            var failure: String? = nil
            do {
                try CodexSetup.installHooks(hookCommand: hook)
                try CodexSetup.trustOurHooks(codex: codex, cwd: job.cwd, hookCommand: hook, path: path)
            } catch {
                failure = error.localizedDescription
            }
            let status = CodexSetup.status(codex: codex, cwd: job.cwd, hookCommand: hook, path: path)
            await MainActor.run {
                self.codexBusy = false
                self.pendingCodexJob = nil
                if let failure {
                    self.composerError = "Codex の Hook 登録に失敗しました: \(failure)"
                } else if status != .ready {
                    self.composerError = "Codex の Hook を有効にできませんでした（codex を最新にしてください）"
                } else {
                    self.launch(prompt: job.prompt, cwd: job.cwd, engine: .codex)
                }
            }
        }
    }

    func cancelCodexSetup() {
        pendingCodexJob = nil
        codexSetupPrompt = false
    }

    func reply(to id: UUID, message: String) {
        composerError = nil
        do {
            try runner.resume(id: id, message: message)
            replyTarget = nil
            AppState.shared.view = .overview
        } catch {
            composerError = error.localizedDescription
            SoundEngine.shared.play("error")
        }
    }

    func cancel(_ id: UUID) {
        if let s = runner.store.session(id: id) {
            HookServer.shared.withdrawRunnerApprovals(taskId: s.agentTaskId)
        }
        runner.cancel(id: id)
    }

    /// Removes a finished task's pill (OK button).
    func dismiss(agentTaskId: String) {
        let state = AppState.shared
        state.removeTask(id: agentTaskId)
        if state.focusId == nil { state.focusId = "integration_claude" }
    }

    func session(forAgentTask id: String?) -> TaskSession? {
        guard let id, id.hasPrefix("runner_") else { return nil }
        return runner.sessions.last { $0.agentTaskId == id }
    }

    var activeSessions: [TaskSession] {
        runner.sessions.filter { !$0.status.isTerminal }.sorted { $0.createdAt > $1.createdAt }
    }

    /// Folders offered in the composer: the live Claude Code session's folder, then recent ones.
    var projectCandidates: [String] {
        var out: [String] = []
        if let cwd = AppState.shared.tasks.first(where: { $0.id == "integration_claude" })?.sessionCwd, !cwd.isEmpty {
            out.append(cwd)
        }
        for p in runner.store.recentProjects where !out.contains(p) { out.append(p) }
        return out.filter { FileManager.default.fileExists(atPath: $0) }
    }

    // MARK: - TaskRunnerDelegate

    func taskRunner(didUpdate update: TaskUpdate) {
        revision += 1
        let s = update.session
        let previous = AppState.shared.tasks.first { $0.id == s.agentTaskId }?.state
        syncPill(s, step: update.step, browsing: update.browsing)
        announce(s, previous: previous)
    }

    func taskRunner(needsApproval request: RunnerApprovalRequest,
                    for session: TaskSession,
                    respond: @escaping @Sendable (ApprovalDecision) -> Void) {
        let info = ApprovalInfo(sessionId: session.claudeSessionId ?? session.idString,
                                tool: request.tool,
                                command: request.command,
                                taskId: session.agentTaskId,
                                guardReason: request.guardReason,
                                allowsAlways: request.allowsAlways)
        HookServer.shared.presentRunnerApproval(info) { decision in
            respond(ApprovalDecision(rawValue: decision) ?? .deny)
        }
    }

    // MARK: - Island state

    static func botState(for status: TaskStatus, browsing: Bool) -> BotState {
        switch status {
        case .queued, .starting, .planning: return .thinking
        case .working:          return browsing ? .searching : .working
        case .verifying:        return .searching
        case .waitingApproval:  return .approval
        case .waitingHuman:     return .question
        case .completed:        return .finished
        case .failed:           return .error
        case .cancelled:        return .idle
        }
    }

    private func syncPill(_ s: TaskSession, step: String?, browsing: Bool) {
        let state = AppState.shared
        let id = s.agentTaskId
        if !state.tasks.contains(where: { $0.id == id }) {
            state.addTask(AgentTask(id: id, name: s.projectName,
                                    color: IslandConst.colorForProject(s.projectName),
                                    state: .thinking, steps: [], source: .claudeCode,
                                    sessionCwd: s.cwd))
        }
        guard let idx = state.tasks.firstIndex(where: { $0.id == id }) else { return }
        state.tasks[idx].state = Self.botState(for: s.status, browsing: browsing)
        if let step, !step.isEmpty {
            state.tasks[idx].steps.append(step)
            if state.tasks[idx].steps.count > 20 { state.tasks[idx].steps.removeFirst() }
            state.tasks[idx].stepIndex = state.tasks[idx].steps.count - 1
        }
    }

    /// Sounds, badges and auto-expansion on status changes — same conventions as HookServer.
    private func announce(_ s: TaskSession, previous: BotState?) {
        let state = AppState.shared
        let id = s.agentTaskId
        let now = Self.botState(for: s.status, browsing: false)
        guard previous != now || s.status.isTerminal || s.status == .waitingHuman else { return }
        let focused = state.focusId == id

        switch s.status {
        case .starting where previous == nil:
            SoundEngine.shared.play("work")
            if state.mode == .hidden { NotificationCenter.default.post(name: .hookReveal, object: nil) }

        case .completed where previous != .finished:
            SoundEngine.shared.play("finish")
            state.focusId = id
            HookServer.shared.expandIfNeeded(to: .finished)
            if !focused, let idx = state.tasks.firstIndex(where: { $0.id == id }) {
                state.tasks[idx].pillBadge = .finished
            }

        case .failed where previous != .error:
            SoundEngine.shared.play("error")
            state.focusId = id
            HookServer.shared.expandIfNeeded(to: .error)

        case .waitingHuman where previous != .question:
            SoundEngine.shared.play("question")
            state.focusId = id
            // A question needs the user: open on the question view (not in HookServer's alert list).
            NotificationCenter.default.post(name: .hookExpand, object: IslandView.question)

        case .cancelled:
            HookServer.shared.withdrawRunnerApprovals(taskId: id)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                self?.dismiss(agentTaskId: id)
            }

        default:
            break
        }
    }
}
