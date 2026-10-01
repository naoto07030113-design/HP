// Linux E2E harness for the Coucou runner core.
// Real claude CLI + real nb-hook.py (extracted from HookServer.swift) + real LocalTaskRunner.
// Only the island UI is replaced: a socket server shaped like HookServer's runner routing,
// and a delegate that answers approvals per scenario.
import Foundation
#if canImport(Glibc)
import Glibc
#endif

let args = CommandLine.arguments
let scenario = args.count > 1 ? args[1] : "build-fix"
let root = URL(fileURLWithPath: args.count > 2 ? args[2] : FileManager.default.currentDirectoryPath)
let supportDir = root.appendingPathComponent("support-\(scenario)")
let socketPath = root.appendingPathComponent("nb-\(scenario).sock").path
setenv("COUCOU_SOCKET", socketPath, 1)
signal(SIGPIPE, SIG_IGN)

func ts() -> String {
    let f = DateFormatter(); f.dateFormat = "HH:mm:ss"; return f.string(from: Date())
}
func log(_ s: String) { FileHandle.standardOutput.write(Data("[\(ts())] \(s)\n".utf8)) }

// MARK: - Socket server (same framing as HookServer: one JSON line in, one line out)

func sendLine(_ fd: Int32, _ text: String) {
    let bytes = Array((text + "\n").utf8)
    bytes.withUnsafeBytes { buf in
        var sent = 0
        while sent < buf.count {
            let n = send(fd, buf.baseAddress! + sent, buf.count - sent, Int32(MSG_NOSIGNAL))
            if n <= 0 { break }
            sent += n
        }
    }
}

@MainActor enum Ref { static var runner: LocalTaskRunner? }
nonisolated(unsafe) var hookEvents: [String] = []
let hookLock = NSLock()

func serve() {
    unlink(socketPath)
    let fd = socket(AF_UNIX, Int32(SOCK_STREAM.rawValue), 0)
    var addr = sockaddr_un()
    addr.sun_family = sa_family_t(AF_UNIX)
    let cpath = Array(socketPath.utf8CString)
    withUnsafeMutableBytes(of: &addr.sun_path) { raw in
        for (i, c) in cpath.enumerated() where i < raw.count { raw[i] = UInt8(bitPattern: c) }
    }
    let rc = withUnsafePointer(to: &addr) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, socklen_t(MemoryLayout<sockaddr_un>.size)) }
    }
    precondition(rc == 0, "bind failed")
    listen(fd, 16)
    Thread.detachNewThread {
        while true {
            let c = accept(fd, nil, nil)
            if c < 0 { break }
            Thread.detachNewThread { handle(c) }
        }
    }
}

func handle(_ fd: Int32) {
    var raw = Data()
    var buf = [UInt8](repeating: 0, count: 4096)
    outer: while true {
        let n = recv(fd, &buf, buf.count, 0)
        if n <= 0 { break }
        for i in 0..<n {
            if buf[i] == UInt8(ascii: "\n") { break outer }
            raw.append(buf[i])
        }
    }
    guard let payload = try? JSONSerialization.jsonObject(with: raw) as? [String: Any] else {
        sendLine(fd, #"{"ok":true}"#); close(fd); return
    }
    let event = payload["hook_event_name"] as? String ?? ""
    hookLock.withLock { hookEvents.append(event) }
    guard let taskId = payload["coucou_task_id"] as? String, !taskId.isEmpty else {
        log("!! non-runner hook event \(event) reached the socket")
        sendLine(fd, #"{"ok":true}"#); close(fd); return
    }
    Task { @MainActor in
        Ref.runner?.handleHook(event: event, payload: payload) { text in
            if event == "Stop" || event == "PreToolUse" && text != "{}" || event == "PermissionRequest" {
                log("   hook reply \(event): \(text.prefix(160).replacingOccurrences(of: "\n", with: " "))")
            }
            sendLine(fd, text)
            close(fd)
        }
    }
}

// MARK: - Delegate

@MainActor
final class Recorder: TaskRunnerDelegate {
    var statuses: [TaskStatus] = []
    var approvals: [RunnerApprovalRequest] = []
    var steps: [String] = []
    var denyGuarded = true

    func taskRunner(didUpdate update: TaskUpdate) {
        let s = update.session
        if statuses.last != s.status { statuses.append(s.status) }
        if let step = update.step { steps.append(step) }
        log("status=\(s.status.rawValue)\(update.browsing ? " (browsing)" : "") step=\(update.step ?? "-")")
    }

    func taskRunner(needsApproval request: RunnerApprovalRequest, for session: TaskSession,
                    respond: @escaping @Sendable (ApprovalDecision) -> Void) {
        approvals.append(request)
        let decision: ApprovalDecision = (request.guardReason != nil && denyGuarded) ? .deny : .allow
        log("APPROVAL tool=\(request.tool) cmd=\(request.command.prefix(80)) guard=\(request.guardReason ?? "-") → \(decision.rawValue)")
        // answer like a user clicking after a moment
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { respond(decision) }
    }
}

// MARK: - Fixtures

func write(_ path: URL, _ text: String) {
    try? FileManager.default.createDirectory(at: path.deletingLastPathComponent(), withIntermediateDirectories: true)
    try! text.write(to: path, atomically: true, encoding: .utf8)
}

func makeProject(_ name: String) -> URL {
    let dir = root.appendingPathComponent("proj-\(name)")
    try? FileManager.default.removeItem(at: dir)
    try! FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
}

func shell(_ cmd: String, cwd: URL) {
    _ = TaskVerifier.shell(cmd, cwd: cwd.path, path: ProcessInfo.processInfo.environment["PATH"], timeout: 30)
}

// MARK: - Run

@MainActor
func run() async -> Int32 {
    serve()
    let hookCmd = "python3 \"\(root.appendingPathComponent("nb-hook.py").path)\" runner"
    var config = LocalTaskRunner.Config(supportDir: supportDir, hookCommand: hookCmd)
    config.claudePathOverride = ProcessInfo.processInfo.environment["CLAUDE_BIN"]
    config.codexPathOverride = ProcessInfo.processInfo.environment["CODEX_BIN"]
    let engine: TaskEngine = scenario.hasPrefix("codex") ? .codex : .claude
    config.hookWatchdog = 30
    let runner = LocalTaskRunner(store: TaskStore(directory: supportDir), config: config)
    let rec = Recorder()
    runner.delegate = rec
    Ref.runner = runner

    let project: URL
    let prompt: String
    switch scenario {
    case "build-fix":
        project = makeProject("build-fix")
        write(project.appendingPathComponent("package.json"), """
        {
          "name": "coucou-e2e",
          "version": "1.0.0",
          "private": true,
          "scripts": {
            "build": "node build.js",
            "test": "node test.js"
          }
        }
        """)
        write(project.appendingPathComponent("build.js"), """
        const fs = require('fs');
        const cfg = JSON.parse(fs.readFileSync('src/config.json', 'utf8'));
        if (typeof cfg.port !== 'number') { console.error('build error: config.port must be a number'); process.exit(1); }
        fs.mkdirSync('dist', { recursive: true });
        fs.writeFileSync('dist/app.txt', 'port=' + cfg.port + '\\n');
        console.log('build ok');
        """)
        // Not mentioned in the prompt: only the Finish Loop will surface it.
        write(project.appendingPathComponent("test.js"), """
        const fs = require('fs');
        const log = fs.existsSync('CHANGELOG.md') ? fs.readFileSync('CHANGELOG.md', 'utf8') : '';
        if (!/config/i.test(log)) { console.error('test failed: CHANGELOG.md must have an entry describing the config fix'); process.exit(1); }
        console.log('tests ok');
        """)
        write(project.appendingPathComponent("src/config.json"), "{\n  \"port\": \"8080\",\n  \"name\": \"demo\",\n}\n")
        prompt = "このプロジェクトをビルドして、エラーがあれば直して"
    case "finish-loop":
        // Verification that fails on its first run whatever Claude does: the Stop hook must block,
        // hand the output back, and Claude must continue and stop again.
        project = makeProject("finish-loop")
        let counter = root.appendingPathComponent("finish-loop.count").path
        try? FileManager.default.removeItem(atPath: counter)
        write(project.appendingPathComponent("hello.txt"), "helo world\n")
        write(project.appendingPathComponent(".coucou/verify"), """
        # first run always fails (simulates a check Claude did not run)
        n=$(cat \(counter) 2>/dev/null || echo 0); echo $((n+1)) > \(counter); if [ "$n" -lt 1 ]; then echo "lint error: hello.txt must end with an exclamation mark"; exit 1; fi
        grep -q 'hello world' hello.txt
        """)
        prompt = "hello.txt のタイポを直してください。"
    case "codex":
        // Codex path: CodexSetup installs + trusts the hook, then the same finish loop / guard / approvals.
        // The model behaviour comes from whatever serves CODEX_HOME's provider (a mock in CI-less tests).
        project = makeProject("codex")
        let counter = root.appendingPathComponent("codex.count").path
        try? FileManager.default.removeItem(atPath: counter)
        write(project.appendingPathComponent("hello.txt"), "helo world\n")
        write(project.appendingPathComponent(".coucou/verify"), """
        n=$(cat \(counter) 2>/dev/null || echo 0); echo $((n+1)) > \(counter); if [ "$n" -lt 1 ]; then echo "check failed (first run)"; exit 1; fi
        """)
        prompt = "hello.txt のタイポを直してください。"
    case "guard":
        project = makeProject("guard")
        write(project.appendingPathComponent("README.md"), "demo\n")
        shell("git init -q && git add -A && git -c user.email=a@b -c user.name=t commit -qm init && git remote add origin https://example.invalid/repo.git", cwd: project)
        prompt = "README.md の末尾に「hello」と1行追加してコミットし、git push origin HEAD まで実行してください。push が拒否されたら push はせずに完了してください。"
    case "needs-human":
        project = makeProject("needs-human")
        write(project.appendingPathComponent("NOTE.md"), "empty\n")
        prompt = "社内の勤怠システム https://kintai.example.invalid に私のアカウントでログインして、今月の残業時間を NOTE.md に書いてください。ログイン情報はあなたには渡せません。"
    default:
        log("unknown scenario"); return 2
    }

    log("scenario=\(scenario) project=\(project.path)")
    if engine == .codex {
        let codex = try! runner.cliPath(for: .codex)
        let path = ProcessInfo.processInfo.environment["PATH"]
        log("codex setup before: \(CodexSetup.status(codex: codex, cwd: project.path, hookCommand: hookCmd, path: path))")
        do {
            let backup = try CodexSetup.installHooks(hookCommand: hookCmd)
            try CodexSetup.trustOurHooks(codex: codex, cwd: project.path, hookCommand: hookCmd, path: path)
            log("codex setup after: \(CodexSetup.status(codex: codex, cwd: project.path, hookCommand: hookCmd, path: path)) backup=\(backup?.lastPathComponent ?? "-")")
        } catch { log("codex setup failed: \(error.localizedDescription)"); return 1 }
    }
    let session: TaskSession
    do {
        session = try runner.start(prompt: prompt, cwd: project.path, engine: engine)
    } catch {
        log("start failed: \(error.localizedDescription)"); return 1
    }
    log("claude session id = \(session.claudeSessionId ?? "-")")

    var resumed = false
    let deadline = Date().addingTimeInterval(1500)
    while Date() < deadline {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        guard let s = runner.store.session(id: session.id), !runner.isRunning(session.id) else { continue }
        if s.status == .waitingHuman && scenario == "needs-human" && !resumed {
            log("waitingHuman detail: \(s.detail ?? "-")  → resuming with a reply")
            resumed = true
            try? runner.resume(id: s.id, message: "この作業はキャンセルします。NOTE.md に「ログイン待ちで中止」と1行だけ書いて完了してください。")
            continue
        }
        if scenario == "codex" && s.status == .completed && !resumed {
            log("completed once (thread \(s.claudeSessionId ?? "-")) → resuming the same Codex thread")
            resumed = true
            do { try runner.resume(id: s.id, message: "もう一度確認して") } catch { log("resume failed: \(error)"); return 1 }
            continue
        }
        if s.status.isTerminal || s.status == .waitingHuman {
            log("FINAL status=\(s.status.rawValue) verified=\(String(describing: s.verified)) verifyRounds=\(s.verifyRounds)")
            log("detail: \(s.detail ?? "-")")
            log("status sequence: \(rec.statuses.map(\.rawValue).joined(separator: " → "))")
            log("approvals: \(rec.approvals.map { "\($0.tool)[\($0.guardReason ?? "normal")]" })")
            let events = hookLock.withLock { hookEvents }
            log("hook events: \(Dictionary(events.map { ($0, 1) }, uniquingKeysWith: +).sorted { $0.key < $1.key })")
            return 0
        }
    }
    log("TIMEOUT"); return 1
}

Task { @MainActor in
    let code = await run()
    exit(code)
}
dispatchMain()
