import Foundation

// MARK: - ClaudeProcess
// Runs the user's own `claude` CLI headless (`-p`, stream-json) for one TaskSession.
// Auth is the CLI's own login (Claude subscription): ANTHROPIC_API_KEY is removed from the
// child environment so a stray key in the user's shell can never switch billing to the API.
// Foundation only.

final class ClaudeProcess: @unchecked Sendable {
    struct LaunchError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    private let process = Process()
    private let logHandle: FileHandle?
    private let lock = NSLock()
    private var lineBuffer = Data()
    private let onLine: @Sendable (String) -> Void
    private let onExit: @Sendable (Int32) -> Void

    var pid: Int32 { process.processIdentifier }
    var isRunning: Bool { process.isRunning }

    init(executable: String,
         arguments: [String],
         cwd: String,
         environment: [String: String],
         logURL: URL?,
         onLine: @escaping @Sendable (String) -> Void,
         onExit: @escaping @Sendable (Int32) -> Void) {
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        process.currentDirectoryURL = URL(fileURLWithPath: cwd)
        process.environment = environment
        if let logURL {
            try? FileManager.default.createDirectory(at: logURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            if !FileManager.default.fileExists(atPath: logURL.path) {
                _ = FileManager.default.createFile(atPath: logURL.path, contents: nil)
            }
            logHandle = try? FileHandle(forWritingTo: logURL)
            _ = try? logHandle?.seekToEnd()
        } else {
            logHandle = nil
        }
        self.onLine = onLine
        self.onExit = onExit
    }

    /// Starts the process and writes `prompt` on stdin (keeps it out of `ps` and avoids argv parsing).
    func start(prompt: String) throws {
        let stdout = Pipe(), stderr = Pipe(), stdin = Pipe()
        process.standardOutput = stdout
        process.standardError = stderr
        process.standardInput = stdin

        // stdout: newline-delimited stream-json, read on a dedicated thread until EOF.
        let readerDone = DispatchSemaphore(value: 0)
        Thread.detachNewThread { [self] in
            let h = stdout.fileHandleForReading
            while true {
                let d = h.availableData
                if d.isEmpty { break }
                consume(d)
            }
            flushLine()
            readerDone.signal()
        }
        Thread.detachNewThread { [self] in
            let h = stderr.fileHandleForReading
            while true {
                let d = h.availableData
                if d.isEmpty { break }
                log(d)
            }
        }
        process.terminationHandler = { [self] p in
            // A background child of claude may keep stdout open: don't wait forever for EOF.
            _ = readerDone.wait(timeout: .now() + 2)
            try? logHandle?.close()
            onExit(p.terminationStatus)
        }

        do {
            try process.run()
        } catch {
            throw LaunchError(message: "Claude Code を起動できません: \(error.localizedDescription)")
        }
        stdin.fileHandleForWriting.write(Data(prompt.utf8))
        try? stdin.fileHandleForWriting.close()
    }

    /// Ctrl-C first (lets Claude Code end the session cleanly), then SIGTERM.
    func stop() {
        guard process.isRunning else { return }
        process.interrupt()
        DispatchQueue.global().asyncAfter(deadline: .now() + 3) { [self] in
            if process.isRunning { process.terminate() }
        }
    }

    private func consume(_ data: Data) {
        log(data)
        var lines: [String] = []
        lock.withLock {
            lineBuffer.append(data)
            while let nl = lineBuffer.firstIndex(of: UInt8(ascii: "\n")) {
                let lineData = lineBuffer.subdata(in: lineBuffer.startIndex..<nl)
                lineBuffer.removeSubrange(lineBuffer.startIndex...nl)
                if let s = String(data: lineData, encoding: .utf8), !s.isEmpty { lines.append(s) }
            }
        }
        lines.forEach(onLine)
    }

    private func flushLine() {
        let rest: String? = lock.withLock {
            defer { lineBuffer.removeAll() }
            return lineBuffer.isEmpty ? nil : String(data: lineBuffer, encoding: .utf8)
        }
        if let rest, !rest.isEmpty { onLine(rest) }
    }

    private func log(_ data: Data) {
        lock.withLock { logHandle?.write(data) }
    }

    // MARK: - Command line

    static func arguments(sessionId: String,
                          resume: Bool,
                          settingsPath: String,
                          permissionMode: String,
                          chrome: Bool) -> [String] {
        var args = ["-p"]
        args += resume ? ["--resume", sessionId] : ["--session-id", sessionId]
        args += ["--settings", settingsPath,
                 "--output-format", "stream-json", "--verbose",
                 "--permission-mode", permissionMode]
        if chrome { args.append("--chrome") }
        return args
    }

    static func environment(base: [String: String], taskId: String, path: String?) -> [String: String] {
        var env = base
        // Subscription / ChatGPT login only (never API billing); never look like a nested agent session.
        for key in ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "CODEX_API_KEY",
                    "CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT", "CLAUDE_CODE_SESSION_ID"] {
            env.removeValue(forKey: key)
        }
        if let path, !path.isEmpty { env["PATH"] = path }
        env["COUCOU_TASK_ID"] = taskId
        return env
    }

    // MARK: - Locating the CLI

    /// `claude` path: explicit override, the usual install locations, then the login shell's PATH.
    static func locateClaude(override: String? = nil) -> String? {
        locate("claude", override: override, extra: ["~/.claude/local/claude"])
    }

    /// `codex` path (npm, Homebrew or the Codex app's bundled CLI).
    static func locateCodex(override: String? = nil) -> String? {
        locate("codex", override: override, extra: ["/Applications/Codex.app/Contents/Resources/codex"])
    }

    static func locate(_ binary: String, override: String?, extra: [String] = []) -> String? {
        let fm = FileManager.default
        if let override, !override.isEmpty, fm.isExecutableFile(atPath: override) { return override }
        let home = fm.homeDirectoryForCurrentUser.path
        let candidates = extra.map { $0.replacingOccurrences(of: "~", with: home) } + [
            "\(home)/.local/bin/\(binary)",
            "/opt/homebrew/bin/\(binary)",
            "/usr/local/bin/\(binary)",
            "\(home)/.npm-global/bin/\(binary)",
            "\(home)/.bun/bin/\(binary)",
            "\(home)/.volta/bin/\(binary)",
        ]
        if let hit = candidates.first(where: { fm.isExecutableFile(atPath: $0) }) { return hit }
        if let path = loginShellPATH() {
            for dir in path.split(separator: ":") {
                let p = "\(dir)/\(binary)"
                if fm.isExecutableFile(atPath: p) { return p }
            }
        }
        return nil
    }

    /// `codex exec` command line. Approvals go to the PermissionRequest hook (Coucou) first;
    /// the sandbox stays workspace-write. The prompt is read from stdin (`-`).
    /// `resume` has no `--approve-for-me`; the same policy is set through config overrides.
    static func codexArguments(resumeThread: String?, cwd: String) -> [String] {
        if let thread = resumeThread {
            return ["exec", "resume", thread, "--json", "--skip-git-repo-check",
                    "-c", "approval_policy=\"on-request\"",
                    "-c", "approvals_reviewer=\"auto_review\"",
                    "-c", "sandbox_mode=\"workspace-write\"",
                    "-"]
        }
        return ["exec", "--json", "--skip-git-repo-check", "--approve-for-me", "-C", cwd, "-"]
    }

    nonisolated(unsafe) private static var cachedPATH: String?
    private static let pathLock = NSLock()

    /// PATH as the user's interactive login shell sees it. A GUI app only gets launchd's minimal
    /// PATH, but `claude` (often a node script) and the project's tools (npm, pnpm, swift…) need the real one.
    static func loginShellPATH() -> String? {
        pathLock.lock(); defer { pathLock.unlock() }
        if let cachedPATH { return cachedPATH }
        let shell = ProcessInfo.processInfo.environment["SHELL"].flatMap { $0.isEmpty ? nil : $0 } ?? "/bin/zsh"
        let marker = "__COUCOU_PATH__"
        guard let out = runCapturing(shell, ["-ilc", "printf '\(marker)%s\(marker)' \"$PATH\""], timeout: 8) else { return nil }
        let parts = out.components(separatedBy: marker)
        guard parts.count >= 3, !parts[1].isEmpty else { return nil }
        cachedPATH = parts[1]
        return parts[1]
    }

    /// Runs a short helper command and returns its stdout (nil on failure or timeout).
    static func runCapturing(_ executable: String, _ args: [String], timeout: TimeInterval) -> String? {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: executable)
        p.arguments = args
        let out = Pipe()
        p.standardOutput = out
        p.standardError = FileHandle.nullDevice
        p.standardInput = FileHandle.nullDevice
        let done = DispatchSemaphore(value: 0)
        p.terminationHandler = { _ in done.signal() }
        do { try p.run() } catch { return nil }
        let collected = LockedData()
        Thread.detachNewThread {
            collected.set(out.fileHandleForReading.readDataToEndOfFile())
        }
        if done.wait(timeout: .now() + timeout) == .timedOut {
            p.terminate()
            return nil
        }
        // give the reader a moment to drain
        for _ in 0..<20 where collected.get() == nil { Thread.sleep(forTimeInterval: 0.05) }
        return collected.get().flatMap { String(data: $0, encoding: .utf8) }
    }
}

/// Tiny thread-safe box used by helpers that read pipes on background threads.
final class LockedData: @unchecked Sendable {
    private let lock = NSLock()
    private var value: Data?
    func set(_ d: Data) { lock.withLock { value = d } }
    func get() -> Data? { lock.withLock { value } }
}
