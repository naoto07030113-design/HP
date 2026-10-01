import Foundation

// MARK: - TaskVerifier
// The Finish Loop's judge. When Claude tries to stop, Coucou runs the project's own checks
// (lint / typecheck / test / build) instead of trusting "終わりました".
// Foundation only.

struct VerificationStep: Sendable, Equatable {
    let name: String
    let command: String
}

struct VerificationResult: Sendable {
    let passed: Bool
    let failedStep: VerificationStep?
    /// Tail of the failing command's output (empty when passed).
    let output: String
    let ran: [VerificationStep]
}

enum TaskVerifier {
    static let perCommandTimeout: TimeInterval = 600

    /// Which checks to run for the project at `cwd`.
    /// `.coucou/verify` (one shell command per line, `#` comments) overrides detection.
    static func plan(cwd: String) -> [VerificationStep] {
        let root = URL(fileURLWithPath: cwd)
        let fm = FileManager.default

        let overrideURL = root.appendingPathComponent(".coucou/verify")
        if let text = try? String(contentsOf: overrideURL, encoding: .utf8) {
            return text.split(whereSeparator: \.isNewline)
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty && !$0.hasPrefix("#") }
                .enumerated()
                .map { VerificationStep(name: "check\($0.offset + 1)", command: $0.element) }
        }

        var steps: [VerificationStep] = []

        // Node / web
        if let data = try? Data(contentsOf: root.appendingPathComponent("package.json")),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let scripts = json["scripts"] as? [String: String] {
            let pm: String
            if fm.fileExists(atPath: root.appendingPathComponent("pnpm-lock.yaml").path) { pm = "pnpm" }
            else if fm.fileExists(atPath: root.appendingPathComponent("yarn.lock").path) { pm = "yarn" }
            else if fm.fileExists(atPath: root.appendingPathComponent("bun.lockb").path)
                    || fm.fileExists(atPath: root.appendingPathComponent("bun.lock").path) { pm = "bun" }
            else { pm = "npm" }
            let groups: [(String, [String])] = [
                ("lint", ["lint"]),
                ("typecheck", ["typecheck", "type-check", "check-types", "tsc"]),
                ("test", ["test"]),
                ("build", ["build"]),
            ]
            for (name, keys) in groups {
                guard let key = keys.first(where: { scripts[$0] != nil }), let body = scripts[key] else { continue }
                if key == "test" && body.contains("no test specified") { continue }
                steps.append(VerificationStep(name: name, command: "\(pm) run \(key)"))
            }
            if !steps.contains(where: { $0.name == "typecheck" }),
               fm.fileExists(atPath: root.appendingPathComponent("tsconfig.json").path),
               fm.fileExists(atPath: root.appendingPathComponent("node_modules/.bin/tsc").path),
               !steps.contains(where: { $0.name == "build" }) {
                steps.insert(VerificationStep(name: "typecheck", command: "node_modules/.bin/tsc --noEmit"), at: min(1, steps.count))
            }
            return steps
        }
        if fm.fileExists(atPath: root.appendingPathComponent("Package.swift").path) {
            return [VerificationStep(name: "build", command: "swift build")]
        }
        if fm.fileExists(atPath: root.appendingPathComponent("Cargo.toml").path) {
            return [VerificationStep(name: "build", command: "cargo build"),
                    VerificationStep(name: "test", command: "cargo test")]
        }
        if fm.fileExists(atPath: root.appendingPathComponent("go.mod").path) {
            return [VerificationStep(name: "build", command: "go build ./..."),
                    VerificationStep(name: "test", command: "go test ./...")]
        }
        return steps
    }

    /// Runs the steps in order, stopping at the first failure.
    static func run(_ steps: [VerificationStep], cwd: String, path: String?) async -> VerificationResult {
        await withCheckedContinuation { (cont: CheckedContinuation<VerificationResult, Never>) in
            DispatchQueue.global(qos: .userInitiated).async {
                var ran: [VerificationStep] = []
                for step in steps {
                    ran.append(step)
                    let r = shell(step.command, cwd: cwd, path: path, timeout: perCommandTimeout)
                    if r.status != 0 {
                        let head = r.timedOut
                            ? "\(step.command) がタイムアウトしました（\(Int(perCommandTimeout))秒）。"
                            : "\(step.command) が終了コード \(r.status) で失敗しました。"
                        cont.resume(returning: VerificationResult(
                            passed: false, failedStep: step, output: head + "\n" + tail(r.output, 4000), ran: ran))
                        return
                    }
                }
                cont.resume(returning: VerificationResult(passed: true, failedStep: nil, output: "", ran: ran))
            }
        }
    }

    /// Blocking: runs `command` with /bin/sh in `cwd`. Combined stdout+stderr.
    static func shell(_ command: String, cwd: String, path: String?, timeout: TimeInterval) -> (status: Int32, output: String, timedOut: Bool) {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/bin/sh")
        p.arguments = ["-c", command]
        p.currentDirectoryURL = URL(fileURLWithPath: cwd)
        var env = ProcessInfo.processInfo.environment
        if let path, !path.isEmpty { env["PATH"] = path }
        env["CI"] = "1"            // test runners: no watch mode, no interactive prompts
        env["FORCE_COLOR"] = "0"
        env["NO_COLOR"] = "1"
        p.environment = env
        let pipe = Pipe()
        p.standardOutput = pipe
        p.standardError = pipe
        p.standardInput = FileHandle.nullDevice
        let done = DispatchSemaphore(value: 0)
        p.terminationHandler = { _ in done.signal() }
        do { try p.run() } catch {
            return (127, "起動できません: \(error.localizedDescription)", false)
        }
        let collected = LockedData()
        let readerDone = DispatchSemaphore(value: 0)
        Thread.detachNewThread {
            collected.set(pipe.fileHandleForReading.readDataToEndOfFile())
            readerDone.signal()
        }
        var timedOut = false
        if done.wait(timeout: .now() + timeout) == .timedOut {
            timedOut = true
            p.terminate()
            _ = done.wait(timeout: .now() + 5)
        }
        _ = readerDone.wait(timeout: .now() + 2)
        let out = collected.get().flatMap { String(data: $0, encoding: .utf8) } ?? ""
        return (timedOut ? 124 : p.terminationStatus, out, timedOut)
    }

    static func tail(_ s: String, _ n: Int) -> String {
        s.count > n ? "…" + String(s.suffix(n)) : s
    }

    /// Reason handed back to Claude when a check fails (Stop hook `decision: block`).
    static func blockReason(_ r: VerificationResult, round: Int, maxRounds: Int) -> String {
        """
        Coucou の自動検証が失敗しました（\(round)/\(maxRounds) 回目）。まだ完了ではありません。
        失敗した検証: \(r.failedStep?.command ?? "?")
        出力:
        \(r.output)

        原因を分析して修正し、同じコマンドで再検証してから終了してください。
        """
    }
}
