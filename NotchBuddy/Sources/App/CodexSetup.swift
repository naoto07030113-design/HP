import Foundation

// MARK: - CodexSetup
// Codex reads hooks from `$CODEX_HOME/hooks.json` (same format as Claude Code) and only runs hooks
// the user has trusted. Coucou adds its `nb-hook runner` entries there — a dated backup first,
// existing hooks kept — then asks Codex itself (app-server `config/batchWrite`) to trust exactly those
// entries. Outside Coucou tasks the hook exits at once (no COUCOU_TASK_ID), so plain `codex` is unaffected.
// Foundation only.

enum CodexSetup {
    enum Status: Equatable, Sendable {
        case ready
        case notInstalled      // our entries are missing from hooks.json
        case untrusted         // present but not (or no longer) trusted
        case unavailable(String)
    }

    /// Events Coucou listens to, with the hook timeout. SessionEnd is left out: Codex caps it at 3s.
    static let events: [(String, Int)] = [
        ("SessionStart", 10), ("UserPromptSubmit", 10),
        ("PreToolUse", 3600), ("PermissionRequest", 3600), ("PostToolUse", 10),
        ("Stop", 3600),
    ]

    static var codexHome: URL {
        if let env = ProcessInfo.processInfo.environment["CODEX_HOME"], !env.isEmpty {
            return URL(fileURLWithPath: env)
        }
        return FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".codex")
    }

    static var hooksURL: URL { codexHome.appendingPathComponent("hooks.json") }

    // MARK: hooks.json

    static func hooksInstalled(hookCommand: String) -> Bool {
        guard let hooks = readHooks() else { return false }
        return events.allSatisfy { event, _ in
            (hooks[event] as? [[String: Any]])?.contains { group in
                (group["hooks"] as? [[String: Any]])?.contains { $0["command"] as? String == hookCommand } ?? false
            } ?? false
        }
    }

    /// Adds Coucou's entries (replacing older Coucou entries), keeping everything else.
    /// Returns the backup path when an existing file was modified.
    @discardableResult
    static func installHooks(hookCommand: String) throws -> URL? {
        if hooksInstalled(hookCommand: hookCommand) && !hasDuplicates(hookCommand: hookCommand) { return nil }
        let fm = FileManager.default
        try fm.createDirectory(at: codexHome, withIntermediateDirectories: true)
        var root: [String: Any] = [:]
        var backup: URL? = nil
        if let data = try? Data(contentsOf: hooksURL) {
            guard let parsed = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw NSError(domain: "CodexSetup", code: 1,
                              userInfo: [NSLocalizedDescriptionKey: "\(hooksURL.path) を読めません（JSON ではありません）"])
            }
            root = parsed
            let f = DateFormatter(); f.dateFormat = "yyyyMMdd-HHmmss"
            let b = codexHome.appendingPathComponent("hooks.json.bak-\(f.string(from: Date()))")
            try? fm.copyItem(at: hooksURL, to: b)
            backup = b
        }
        var hooks = root["hooks"] as? [String: Any] ?? [:]
        for (event, timeout) in events {
            var groups = hooks[event] as? [[String: Any]] ?? []
            groups.removeAll { group in
                (group["hooks"] as? [[String: Any]])?.contains {
                    let c = $0["command"] as? String
                    return c == hookCommand || isCoucouCommand(c)
                } ?? false
            }
            groups.append(["hooks": [["type": "command", "command": hookCommand, "timeout": timeout]]])
            hooks[event] = groups
        }
        root["hooks"] = hooks
        let data = try JSONSerialization.data(withJSONObject: root, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: hooksURL, options: .atomic)
        return backup
    }

    private static func hasDuplicates(hookCommand: String) -> Bool {
        guard let hooks = readHooks() else { return false }
        return events.contains { event, _ in
            let n = (hooks[event] as? [[String: Any]])?.reduce(0) { acc, group in
                acc + ((group["hooks"] as? [[String: Any]])?.filter { $0["command"] as? String == hookCommand }.count ?? 0)
            } ?? 0
            return n > 1
        }
    }

    static func isCoucouCommand(_ command: String?) -> Bool {
        guard let command else { return false }
        return command.contains("NotchBuddy/nb-hook") && command.hasSuffix(" runner")
    }

    private static func readHooks() -> [String: Any]? {
        guard let data = try? Data(contentsOf: hooksURL),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return root["hooks"] as? [String: Any]
    }

    // MARK: Trust (through `codex app-server`)

    /// Checks hooks.json and Codex's trust state for our entries.
    static func status(codex: String, cwd: String, hookCommand: String, path: String?) -> Status {
        guard hooksInstalled(hookCommand: hookCommand) else { return .notInstalled }
        do {
            let ours = try listOurHooks(codex: codex, cwd: cwd, hookCommand: hookCommand, path: path)
            if ours.count < events.count { return .notInstalled }
            return ours.allSatisfy { $0.trust == "trusted" } ? .ready : .untrusted
        } catch {
            return .unavailable(error.localizedDescription)
        }
    }

    /// Marks Coucou's hook entries as trusted (only those; other hooks keep their own state).
    static func trustOurHooks(codex: String, cwd: String, hookCommand: String, path: String?) throws {
        try withAppServer(codex: codex, path: path) { rpc in
            let ours = try hooksList(rpc, cwd: cwd).filter { $0.command == hookCommand }
            let todo = ours.filter { $0.trust != "trusted" }
            guard !todo.isEmpty else { return }
            var value: [String: Any] = [:]
            for h in todo { value[h.key] = ["trusted_hash": h.hash] }
            let resp = try rpc.call("config/batchWrite", [
                "edits": [["keyPath": "hooks.state", "value": value, "mergeStrategy": "upsert"]],
            ])
            if let err = resp["error"] as? [String: Any] {
                throw NSError(domain: "CodexSetup", code: 2,
                              userInfo: [NSLocalizedDescriptionKey: "Codex の設定を書けません: \(err["message"] as? String ?? "?")"])
            }
        }
    }

    struct HookEntry: Sendable {
        let key: String
        let command: String
        let hash: String
        let trust: String
    }

    static func listOurHooks(codex: String, cwd: String, hookCommand: String, path: String?) throws -> [HookEntry] {
        try withAppServer(codex: codex, path: path) { rpc in
            try hooksList(rpc, cwd: cwd).filter { $0.command == hookCommand }
        }
    }

    private static func hooksList(_ rpc: AppServerRPC, cwd: String) throws -> [HookEntry] {
        let resp = try rpc.call("hooks/list", ["cwds": [cwd]])
        guard let result = resp["result"] as? [String: Any], let data = result["data"] as? [[String: Any]] else {
            throw NSError(domain: "CodexSetup", code: 3, userInfo: [NSLocalizedDescriptionKey: "Codex の Hook 一覧を取得できません"])
        }
        return data.flatMap { ($0["hooks"] as? [[String: Any]]) ?? [] }.compactMap { h in
            guard let key = h["key"] as? String, let command = h["command"] as? String,
                  let hash = h["currentHash"] as? String else { return nil }
            return HookEntry(key: key, command: command, hash: hash, trust: h["trustStatus"] as? String ?? "untrusted")
        }
    }

    private static func withAppServer<T>(codex: String, path: String?, _ body: (AppServerRPC) throws -> T) throws -> T {
        let rpc = try AppServerRPC(codex: codex, path: path)
        defer { rpc.close() }
        _ = try rpc.call("initialize", ["clientInfo": ["name": "coucou", "version": "1"]])
        try rpc.notify("initialized")
        return try body(rpc)
    }
}

// MARK: - Minimal JSON-RPC client for `codex app-server` (stdio, one JSON object per line)

final class AppServerRPC {
    private let process = Process()
    private let input = Pipe()
    private let output = Pipe()
    private var buffer = Data()
    private var nextId = 1
    private let timeout: TimeInterval

    init(codex: String, path: String?, timeout: TimeInterval = 20) throws {
        self.timeout = timeout
        process.executableURL = URL(fileURLWithPath: codex)
        process.arguments = ["app-server"]
        var env = ProcessInfo.processInfo.environment
        if let path, !path.isEmpty { env["PATH"] = path }
        env.removeValue(forKey: "OPENAI_API_KEY")
        env.removeValue(forKey: "CODEX_API_KEY")
        process.environment = env
        process.standardInput = input
        process.standardOutput = output
        process.standardError = FileHandle.nullDevice
        try process.run()
    }

    func notify(_ method: String) throws {
        try send(["jsonrpc": "2.0", "method": method])
    }

    func call(_ method: String, _ params: [String: Any]) throws -> [String: Any] {
        let id = nextId; nextId += 1
        try send(["jsonrpc": "2.0", "id": id, "method": method, "params": params])
        // A hung app-server is killed so the blocking read below sees EOF.
        nonisolated(unsafe) let proc = process
        let watchdog = DispatchWorkItem { if proc.isRunning { proc.terminate() } }
        DispatchQueue.global().asyncAfter(deadline: .now() + timeout, execute: watchdog)
        defer { watchdog.cancel() }
        while true {
            guard let line = readLine() else { break }
            guard let msg = try? JSONSerialization.jsonObject(with: line) as? [String: Any] else { continue }
            if (msg["id"] as? Int) == id { return msg }
        }
        throw NSError(domain: "AppServerRPC", code: 1, userInfo: [NSLocalizedDescriptionKey: "codex app-server が応答しません（\(method)）"])
    }

    func close() {
        try? input.fileHandleForWriting.close()
        if process.isRunning { process.terminate() }
    }

    private func send(_ obj: [String: Any]) throws {
        var data = try JSONSerialization.data(withJSONObject: obj)
        data.append(UInt8(ascii: "\n"))
        input.fileHandleForWriting.write(data)
    }

    /// Next stdout line; nil at EOF (process exited or killed by the watchdog).
    private func readLine() -> Data? {
        while true {
            if let nl = buffer.firstIndex(of: UInt8(ascii: "\n")) {
                let line = buffer.subdata(in: buffer.startIndex..<nl)
                buffer.removeSubrange(buffer.startIndex...nl)
                return line
            }
            let chunk = output.fileHandleForReading.availableData
            if chunk.isEmpty { return nil }
            buffer.append(chunk)
        }
    }
}
