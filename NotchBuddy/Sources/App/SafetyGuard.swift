import Foundation

// MARK: - SafetyGuard
// Operations that must never run without an explicit click in Coucou, even when the user's
// Claude Code permission rules would allow them (git push, prod deploy, rm -rf, …).
// Checked on PreToolUse for tasks started from Coucou. Foundation only.

enum SafetyGuard {
    struct Verdict: Equatable, Sendable {
        let reason: String
    }

    private struct Rule {
        let reason: String
        let regex: NSRegularExpression
    }

    private static func rule(_ reason: String, _ pattern: String) -> Rule {
        // Patterns are constants: a typo must fail loudly in tests, not silently disable a rule.
        Rule(reason: reason, regex: try! NSRegularExpression(pattern: pattern, options: [.caseInsensitive]))
    }

    private static let commandRules: [Rule] = [
        // git
        rule("git push", #"\bgit\b(\s+-\S+(\s+\S+)?)*\s+push\b"#),
        rule("git reset --hard", #"\bgit\s+reset\b[^;&|]*--hard\b"#),
        rule("git clean（未追跡ファイル削除）", #"\bgit\s+clean\b[^;&|]*\s-[a-z]*f"#),
        rule("gh pr merge", #"\bgh\s+pr\s+merge\b"#),
        rule("gh release create", #"\bgh\s+release\s+create\b"#),
        // production deploy / publish
        rule("production deploy", #"\b(vercel|netlify)\b[^;&|]*(--prod\b|--production\b)"#),
        rule("production deploy", #"\b(firebase|fly|flyctl|wrangler)\s+deploy\b"#),
        rule("production deploy", #"\bgcloud\b[^;&|]*\bdeploy\b"#),
        rule("production deploy", #"\b(eb|serverless|sls|cdk)\s+deploy\b"#),
        rule("infrastructure change", #"\bterraform\s+(apply|destroy)\b"#),
        rule("infrastructure change", #"\bkubectl\s+(apply|delete|replace|rollout|scale)\b"#),
        rule("package publish", #"\b(npm|pnpm|yarn)\s+publish\b|\bcargo\s+publish\b|\btwine\s+upload\b|\bpod\s+trunk\s+push\b"#),
        rule("app store submit", #"\beas\s+submit\b|\bfastlane\b[^;&|]*\b(deliver|release|upload_to_app_store)\b|\baltool\b[^;&|]*--upload"#),
        // databases
        rule("destructive database operation", #"\bdrop\s+(table|database|schema|index|view)\b"#),
        rule("destructive database operation", #"\btruncate\s+(table\s+)?\w"#),
        rule("destructive database operation", #"\bdelete\s+from\b"#),
        rule("destructive database operation", #"\balter\s+table\b[^;]*\bdrop\b"#),
        rule("destructive database migration", #"\bprisma\s+(migrate\s+(reset|deploy)|db\s+push)\b"#),
        rule("destructive database migration", #"\bsupabase\s+(db\s+(push|reset)|migration\s+repair)\b"#),
        rule("destructive database migration", #"\b(rails|rake)\s+db:(drop|reset|migrate:reset|schema:load)\b"#),
        rule("destructive database migration", #"\b(sequelize|knex|typeorm)\b[^;&|]*\b(db:drop|migrate:rollback|schema:drop)\b"#),
        rule("destructive database operation", #"\bdropdb\b|\bredis-cli\b[^;&|]*\bflush(all|db)\b|\bdropDatabase\s*\("#),
        // mass deletion
        rule("ファイル大量削除", #"\bfind\b[^;&|]*\s-delete\b"#),
        rule("ファイル大量削除", #"\bxargs\b[^;&|]*\brm\b"#),
        rule("ディスク操作", #"\b(mkfs(\.\w+)?|diskutil\s+(erase\w*|partition\w*)|dd\s+if=)"#),
        // external sends / money
        rule("外部への送信（メール）", #"(^|[;&|(]\s*)(sendmail|mailx?)\s"#),
        rule("外部への送信", #"\bcurl\b[^;&|]*(api\.resend\.com|api\.sendgrid\.com|api\.mailgun\.net|api\.postmarkapp\.com|hooks\.slack\.com|slack\.com/api/chat\.postMessage|discord(app)?\.com/api/webhooks)"#),
        rule("金銭操作", #"\bcurl\b[^;&|]*api\.stripe\.com"#),
        rule("金銭操作", #"\bstripe\s+(charges|payment_intents|refunds|payouts|transfers|subscriptions|invoices)\s+(create|pay|cancel|update|delete)\b"#),
        // credentials / permissions
        rule("重大な権限変更", #"\bsudo\b"#),
        rule("重大な権限変更", #"\bchmod\b[^;&|]*(\s-R\b|\b777\b|a\+rwx)|\bchown\s+-R\b"#),
        rule("認証情報変更", #"\bsecurity\s+(add|delete|set)-\w*(password|certificate|keychain)"#),
        rule("認証情報変更", #"\b(gh\s+auth|npm\s+(token|adduser|login)|vercel\s+(login|logout)|gcloud\s+auth|aws\s+configure|ssh-keygen|ssh-add)\b"#),
        rule("認証情報変更", #"\b(gh|vercel|netlify|flyctl|heroku|supabase)\s+(secrets?|env)\s+(set|add|rm|remove|delete|unset)\b"#),
    ]

    /// MCP tool names that send, deploy, publish, pay or delete on an external service.
    private static let mcpRule = rule(
        "外部サービスへの操作",
        #"(send|deploy|publish|delete|remove|trash|merge|payment|charge|refund|transfer|payout|submit|purchase|buy|invite|share)"#)

    /// Files whose modification changes credentials or Claude Code's own permissions.
    private static let sensitivePathRule = rule(
        "認証情報・設定ファイルの変更",
        #"(^|/)(\.env(\.[\w.-]+)?|\.npmrc|\.netrc|\.pgpass|id_(rsa|ed25519|ecdsa)[^/]*|credentials(\.json)?|\.git-credentials)$|(^|/)\.(ssh|aws|gnupg|kube)/|(^|/)\.claude/settings(\.local)?\.json$|(^|/)\.git/(config|hooks/)"#)

    /// Returns why the tool call needs the user's explicit approval, or nil if it may run.
    static func check(tool: String, input: [String: Any]) -> Verdict? {
        switch tool {
        case "Bash", "PowerShell":
            return check(command: input["command"] as? String ?? "")
        case "Write", "Edit", "MultiEdit", "NotebookEdit":
            let path = (input["file_path"] as? String) ?? (input["notebook_path"] as? String) ?? ""
            return check(path: path)
        default:
            if tool.hasPrefix("mcp__") {
                // mcp__<server>__<tool>: judge the tool part only, the server name is irrelevant
                let name = tool.components(separatedBy: "__").last ?? tool
                if matches(mcpRule.regex, name) {
                    return Verdict(reason: "\(mcpRule.reason): \(name)")
                }
            }
            return nil
        }
    }

    static func check(command: String) -> Verdict? {
        let cmd = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cmd.isEmpty else { return nil }
        if isRecursiveForceRemove(cmd) { return Verdict(reason: "rm -rf") }
        for r in commandRules where matches(r.regex, cmd) {
            return Verdict(reason: r.reason)
        }
        return nil
    }

    static func check(path: String) -> Verdict? {
        guard !path.isEmpty else { return nil }
        return matches(sensitivePathRule.regex, path) ? Verdict(reason: sensitivePathRule.reason) : nil
    }

    private static func matches(_ regex: NSRegularExpression, _ text: String) -> Bool {
        regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) != nil
    }

    /// `rm` with both recursive and force flags, in any spelling (-rf, -fr, -Rf, -r -f, --recursive --force).
    private static func isRecursiveForceRemove(_ cmd: String) -> Bool {
        let separators = CharacterSet(charactersIn: ";&|()\n`")
        for segment in cmd.components(separatedBy: separators) {
            var tokens = segment.split(whereSeparator: { $0 == " " || $0 == "\t" }).map(String.init)
            // skip leading wrappers: sudo, env VAR=…, command, xargs, nice…
            while let first = tokens.first,
                  ["sudo", "env", "command", "builtin", "nice", "nohup", "time", "xargs"].contains(first) || first.contains("=") {
                tokens.removeFirst()
            }
            guard let head = tokens.first, head == "rm" || head.hasSuffix("/rm") else { continue }
            var recursive = false, force = false
            for t in tokens.dropFirst() {
                if t == "--" { break }
                if t == "--recursive" { recursive = true; continue }
                if t == "--force" { force = true; continue }
                if t.hasPrefix("-") && !t.hasPrefix("--") {
                    if t.contains("r") || t.contains("R") { recursive = true }
                    if t.contains("f") { force = true }
                }
            }
            if recursive && force { return true }
        }
        return false
    }
}
