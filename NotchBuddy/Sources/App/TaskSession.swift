import Foundation

// MARK: - Engine

/// Which coding agent runs the task. Both are driven headless with the user's own login.
enum TaskEngine: String, Codable, Sendable, CaseIterable {
    case claude, codex

    var label: String {
        switch self {
        case .claude: return "Claude Code"
        case .codex:  return "Codex"
        }
    }
}

// MARK: - TaskSession
// One job handed to Claude Code from Coucou ("このアプリのバグを直しておいて").
// Foundation only — no AppKit/SwiftUI — so the runner core stays testable headless.

enum TaskStatus: String, Codable, Sendable, CaseIterable {
    case queued, starting, planning, working, verifying
    case waitingApproval, waitingHuman
    case completed, failed, cancelled

    /// No more work will happen without a new instruction.
    var isTerminal: Bool {
        switch self {
        case .completed, .failed, .cancelled: return true
        default: return false
        }
    }

    /// A Claude Code process is (or should be) running for this task.
    var isRunning: Bool { !isTerminal && self != .waitingHuman }

    var label: String {
        switch self {
        case .queued:          return "待機中"
        case .starting:        return "起動中"
        case .planning:        return "計画中"
        case .working:         return "作業中"
        case .verifying:       return "検証中"
        case .waitingApproval: return "承認待ち"
        case .waitingHuman:    return "対応待ち"
        case .completed:       return "完了"
        case .failed:          return "失敗"
        case .cancelled:       return "停止"
        }
    }
}

struct TaskSession: Codable, Identifiable, Sendable, Equatable {
    let id: UUID
    let prompt: String
    let cwd: String
    var status: TaskStatus
    var pid: Int32?
    /// Agent session to resume: our UUID for Claude Code (`--session-id`), the thread id Codex reports.
    var claudeSessionId: String?
    var createdAt: Date
    var finishedAt: Date?

    /// Finish-loop rounds that ended with a failing verification (reset on resume).
    var verifyRounds: Int
    /// Last thing worth showing: Claude's final message, failure reason, what the human must do…
    var detail: String?
    /// Whether the last completion was backed by a passing verification run.
    var verified: Bool?
    /// nil in tasks saved before Codex support = Claude Code.
    var engine: TaskEngine?

    var engineKind: TaskEngine { engine ?? .claude }

    init(id: UUID = UUID(), prompt: String, cwd: String, status: TaskStatus = .queued,
         engine: TaskEngine = .claude, createdAt: Date = Date()) {
        self.id = id
        self.prompt = prompt
        self.cwd = cwd
        self.status = status
        self.pid = nil
        self.claudeSessionId = nil
        self.createdAt = createdAt
        self.finishedAt = nil
        self.verifyRounds = 0
        self.detail = nil
        self.verified = nil
        self.engine = engine
    }

    /// Lowercase UUID string — what we pass to `claude --session-id`, and what hooks echo back.
    var idString: String { id.uuidString.lowercased() }

    /// AgentTask id used for this task's pill in the island.
    var agentTaskId: String { "runner_" + idString }

    var projectName: String {
        let name = URL(fileURLWithPath: cwd).lastPathComponent
        return name.isEmpty ? "Task" : name
    }
}

// MARK: - Prompt sent to Claude Code

enum TaskPrompt {
    /// Marker lines Claude is asked to end its final message with.
    static let doneMarker = "COUCOU_STATUS: DONE"
    static let needsHumanMarker = "COUCOU_STATUS: NEEDS_HUMAN"

    static func build(goal: String) -> String {
        """
        GOAL
        \(goal)

        RULES
        このタスクの最終ゴールまで可能な限り自律的に進めてください。
        軽微な実装判断について逐一質問しないでください。
        必要に応じて以下を行ってください。
        - 既存コード調査
        - 実装
        - エラー調査
        - テスト
        - lint
        - typecheck
        - build
        - ブラウザ確認
        - 修正
        - 再テスト
        単にコードを書いた時点で完成としないでください。
        実際に動作確認可能な場合は必ず検証してください。
        問題がある場合は、
        原因分析 → 修正 → 再検証
        を行ってください。
        以下の操作についてはユーザー承認を要求してください。
        - production deploy
        - git push
        - destructive database operation
        - ファイル大量削除
        - 金銭操作
        - 外部への正式送信
        - 認証情報変更
        - 重大な権限変更
        MFAやCAPTCHAを回避しないでください。

        EXECUTION CONTEXT (Coucou)
        - このセッションは Coucou からバックグラウンドで起動されています。ユーザーはターミナルを見ていません。
        - 上記の承認が必要な操作は、そのままツールとして実行してください。Coucou が実行前にユーザーへ承認を求めます。拒否された場合はその操作を行わずに進めてください。
        - Webアプリの場合、ブラウザ操作ツール（Claude in Chrome など）が使えるならそれを優先して、起動 → 表示 → クリック/フォーム操作 → console確認 → 修正 → 再確認 まで行ってください。使えない場合は Playwright や curl 等で代替してください。
        - ブラウザのログイン状態を利用してください。パスワード・トークン等の認証情報を CLAUDE.md やソースコード、その他のファイルに保存しないでください。
        - あなたが終了しようとすると、Coucou が lint / typecheck / test / build 等を自動実行して結果を確認します。失敗した場合はその出力が渡されるので、原因を直して再検証してください。
        - ログイン切れ、MFA、CAPTCHA、ユーザーしか判断できない事項など、人の対応なしには進めない場合だけ、最終メッセージの最後の行を次の形式にして終了してください:
          \(needsHumanMarker): <ユーザーにしてほしいことを日本語で一文>
        - ゴールを達成し検証も済んだら、最終メッセージに短い日本語の完了報告を書き、最後の行を次にしてください:
          \(doneMarker)
        """
    }

    /// Message used when the user answers a task that was waiting for them (or asks to retry).
    static func followUp(_ message: String) -> String {
        """
        USER REPLY
        \(message)

        最初の GOAL と RULES に従って、最終ゴールまで自律的に続けてください。
        """
    }

    enum Marker: Equatable, Sendable {
        case done
        case needsHuman(String)
        case none
    }

    /// Reads the marker on Claude's last message. Only the last non-empty lines are considered,
    /// so quoting the rules back does not count.
    static func parseMarker(_ text: String?) -> Marker {
        guard let text else { return .none }
        let lines = text.split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        for line in lines.suffix(3).reversed() {
            let clean = line.trimmingCharacters(in: CharacterSet(charactersIn: "`*_ "))
            if clean.hasPrefix(needsHumanMarker) {
                var reason = String(clean.dropFirst(needsHumanMarker.count))
                reason = reason.trimmingCharacters(in: CharacterSet(charactersIn: ": ").union(.whitespaces))
                return .needsHuman(reason.isEmpty ? "ユーザーの対応が必要です" : reason)
            }
            if clean.hasPrefix(doneMarker) { return .done }
        }
        return .none
    }

    /// Claude's final message without the marker line, shortened for the island.
    static func summary(_ text: String?, limit: Int = 140) -> String? {
        guard let text else { return nil }
        let lines = text.split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && !$0.contains("COUCOU_STATUS:") }
        guard !lines.isEmpty else { return nil }
        let joined = lines.joined(separator: " ")
        return joined.count > limit ? String(joined.prefix(limit - 1)) + "…" : joined
    }
}
