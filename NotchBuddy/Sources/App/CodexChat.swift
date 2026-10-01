import Foundation

// MARK: - Chat provider (island 💬)
// "Claude" = Anthropic API key (original Coucou chat). "GPT" = the user's Codex CLI with its ChatGPT
// login: no API key, usage counts against the ChatGPT plan's Codex limits.

enum ChatProvider: String, Sendable {
    case claude, gpt

    static let defaultsKey = "chatProvider"

    /// Saved choice; otherwise Claude when an Anthropic key is set, else GPT when Codex is installed.
    static func current(hasAnthropicKey: Bool) -> ChatProvider {
        if let raw = UserDefaults.standard.string(forKey: defaultsKey), let p = ChatProvider(rawValue: raw) { return p }
        if hasAnthropicKey { return .claude }
        return ClaudeProcess.locateCodex(override: UserDefaults.standard.string(forKey: "codexCLIPath")) != nil ? .gpt : .claude
    }

    var label: String { self == .claude ? "Claude" : "GPT" }
}

// MARK: - CodexChat
// One `codex exec` per message, read-only sandbox, in a scratch folder; follow-ups resume the thread.
// Foundation only.

enum CodexChat {
    struct Reply: Sendable {
        let text: String
        let thread: String?
    }

    struct ChatError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    static let instructions = """
    あなたは Mac のノッチに住むアシスタント Mochi です。ユーザーの言語で答えてください。
    マークダウン記法（**、##、箇条書きの - など）は使わず、改行だけのプレーンテキストで答えてください。
    ファイルの変更やコマンドの実行はせず、質問に答えることだけをしてください。
    """

    static func arguments(thread: String?, workdir: String) -> [String] {
        if let thread {
            return ["exec", "resume", thread, "--json", "--skip-git-repo-check",
                    "-c", "sandbox_mode=\"read-only\"", "-"]
        }
        return ["exec", "--json", "--skip-git-repo-check", "-s", "read-only", "-C", workdir, "-"]
    }

    /// Text sent to Codex: instructions + context on the first message only.
    static func prompt(message: String, context: String?, firstMessage: Bool) -> String {
        guard firstMessage else { return message }
        var parts = [instructions]
        if let context, !context.isEmpty { parts.append("コンテキスト:\n\(context)") }
        parts.append("質問:\n\(message)")
        return parts.joined(separator: "\n\n")
    }

    /// Final agent message and thread id from `codex exec --json` output.
    static func parse(_ output: String) -> (text: String?, thread: String?, error: String?) {
        var text: String?, thread: String?, error: String?
        for line in output.split(whereSeparator: \.isNewline) {
            guard let data = line.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { continue }
            switch json["type"] as? String {
            case "thread.started":
                thread = json["thread_id"] as? String
            case "item.completed":
                if let item = json["item"] as? [String: Any], item["type"] as? String == "agent_message",
                   let t = item["text"] as? String, !t.isEmpty { text = t }
            case "turn.failed":
                error = ((json["error"] as? [String: Any])?["message"] as? String) ?? "Codex のターンが失敗しました"
            case "error":
                error = json["message"] as? String ?? "Codex エラー"
            default:
                break
            }
        }
        return (text, thread, error)
    }

    /// Blocking call — run off the main thread.
    static func send(message: String, context: String?, thread: String?,
                     codex: String, workdir: URL, timeout: TimeInterval = 240) throws -> Reply {
        try FileManager.default.createDirectory(at: workdir, withIntermediateDirectories: true)
        let p = Process()
        p.executableURL = URL(fileURLWithPath: codex)
        p.arguments = arguments(thread: thread, workdir: workdir.path)
        p.currentDirectoryURL = workdir
        var env = ClaudeProcess.environment(base: ProcessInfo.processInfo.environment, taskId: "",
                                            path: ClaudeProcess.loginShellPATH())
        env.removeValue(forKey: "COUCOU_TASK_ID")   // a chat is not a Coucou task: hooks stay silent
        p.environment = env
        let stdin = Pipe(), stdout = Pipe()
        p.standardInput = stdin
        p.standardOutput = stdout
        p.standardError = FileHandle.nullDevice
        let done = DispatchSemaphore(value: 0)
        p.terminationHandler = { _ in done.signal() }
        try p.run()
        let collected = LockedData()
        let readerDone = DispatchSemaphore(value: 0)
        Thread.detachNewThread {
            collected.set(stdout.fileHandleForReading.readDataToEndOfFile())
            readerDone.signal()
        }
        stdin.fileHandleForWriting.write(Data(prompt(message: message, context: context, firstMessage: thread == nil).utf8))
        try? stdin.fileHandleForWriting.close()
        if done.wait(timeout: .now() + timeout) == .timedOut {
            p.terminate()
            throw ChatError(message: "Codex の応答がタイムアウトしました。")
        }
        _ = readerDone.wait(timeout: .now() + 2)
        let out = collected.get().flatMap { String(data: $0, encoding: .utf8) } ?? ""
        let parsed = parse(out)
        if let text = parsed.text {
            return Reply(text: text.trimmingCharacters(in: .whitespacesAndNewlines), thread: parsed.thread ?? thread)
        }
        throw ChatError(message: parsed.error
                        ?? "Codex から返答がありません（ターミナルで codex を起動して ChatGPT でログインしているか確認してください）")
    }
}
