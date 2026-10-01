import AppKit
import SwiftUI

// MARK: - Task composer (island view `.task`)
// "Claude に仕事を頼む": pick a folder (current Claude Code session, recent, or any), type the job, send.
// Same card / field / send button as PromptView.

struct TaskComposerView: View {
    @ObservedObject var state: AppState
    @ObservedObject private var bridge = TaskRunnerBridge.shared
    @State private var text: String = ""
    @AppStorage("runnerLastCwd") private var cwd: String = ""
    @FocusState private var focused: Bool

    private var replySession: TaskSession? {
        bridge.replyTarget.flatMap { bridge.runner.store.session(id: $0) }
    }

    var body: some View {
        ZStack(alignment: .leading) {
            CardBackground(wash: .indigo)

            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 8) {
                    if let r = replySession {
                        HStack(spacing: 5) {
                            Image(systemName: "arrowshape.turn.up.left.fill").font(.system(size: 10))
                            Text("\(r.projectName) に返信").font(.system(size: 11.5, weight: .medium)).lineLimit(1)
                            Button(action: { bridge.replyTarget = nil }) {
                                Image(systemName: "xmark").font(.system(size: 9, weight: .semibold))
                            }
                            .buttonStyle(.plain)
                        }
                        .foregroundColor(Color(hex: "#C7C9FF"))
                    } else {
                        projectMenu
                        Button(action: { bridge.useChrome.toggle() }) {
                            Image(systemName: "globe")
                                .font(.system(size: 11))
                                .foregroundColor(bridge.useChrome ? Color(hex: "#C7C9FF") : Color(hex: "#5F646D"))
                        }
                        .buttonStyle(.plain)
                        .help(bridge.useChrome ? "ブラウザ確認に Claude in Chrome を使う（オン）" : "Claude in Chrome を使わない（オフ）")
                    }
                    Spacer(minLength: 4)
                    if let active = bridge.activeSessions.first {
                        activeChip(active)
                    }
                }

                HStack(spacing: 8) {
                    TextField(replySession == nil ? "Claude に任せたい仕事を書いてください…" : "返信を書いてください…", text: $text)
                        .textFieldStyle(.plain)
                        .font(.system(size: 13))
                        .focused($focused)
                        .onSubmit { submit() }

                    Button(action: submit) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(hex: "#0B0C0E"))
                    }
                    .buttonStyle(SendButtonStyle())
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Color.white.opacity(0.07))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .simultaneousGesture(TapGesture().onEnded { focused = true })

                if let err = bridge.composerError {
                    Text(err)
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#FF8D97"))
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
            }
            .padding(.leading, 84)
            .padding(.trailing, 16)
        }
        .onAppear {
            focused = true
            if cwd.isEmpty || !FileManager.default.fileExists(atPath: cwd) {
                cwd = bridge.projectCandidates.first ?? ""
            }
        }
    }

    private var projectMenu: some View {
        Menu {
            ForEach(bridge.projectCandidates, id: \.self) { path in
                Button(shortPath(path)) { cwd = path }
            }
            if !bridge.projectCandidates.isEmpty { Divider() }
            Button("フォルダを選択…") { chooseFolder() }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "folder.fill").font(.system(size: 10))
                Text(cwd.isEmpty ? "フォルダを選択" : URL(fileURLWithPath: cwd).lastPathComponent)
                    .font(.system(size: 11.5, weight: .medium))
                    .lineLimit(1)
            }
            .foregroundColor(Color(hex: "#C7C9FF"))
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.visible)
        .fixedSize()
    }

    private func activeChip(_ s: TaskSession) -> some View {
        HStack(spacing: 6) {
            Circle().fill(Color(hex: IslandConst.colorForProject(s.projectName))).frame(width: 6, height: 6)
            Text("\(s.projectName) · \(s.status.label)")
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "#9398A1"))
                .lineLimit(1)
            Button(action: { bridge.cancel(s.id) }) {
                Image(systemName: "stop.fill")
                    .font(.system(size: 8))
                    .foregroundColor(Color(hex: "#F4505E"))
            }
            .buttonStyle(.plain)
            .help("このタスクを停止")
        }
    }

    private func submit() {
        let job = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !job.isEmpty else { return }
        if let r = replySession {
            text = ""
            bridge.reply(to: r.id, message: job)
            return
        }
        guard !cwd.isEmpty else {
            bridge.composerError = "作業フォルダを選んでください。"
            return
        }
        text = ""
        SoundEngine.shared.play("send")
        bridge.start(prompt: job, cwd: cwd)
    }

    private func chooseFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "このフォルダで作業"
        if !cwd.isEmpty { panel.directoryURL = URL(fileURLWithPath: cwd) }
        NSApp.activate(ignoringOtherApps: true)
        if panel.runModal() == .OK, let url = panel.url {
            cwd = url.path
        }
    }

    private func shortPath(_ path: String) -> String {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return path.hasPrefix(home) ? "~" + path.dropFirst(home.count) : path
    }
}

// MARK: - Alert cards for tasks started from Coucou
// Same layout as the Claude Code question / error / finished cards.

/// Claude stopped because only the user can unblock it (login, MFA, a decision…).
struct RunnerQuestionView: View {
    @ObservedObject var state: AppState
    let session: TaskSession

    var body: some View {
        ZStack {
            CardBackground(wash: .cyan)
            VStack(alignment: .leading, spacing: 5) {
                AgentWho(task: state.focusTask, label: "対応をお願いします")
                Text(session.detail ?? "ユーザーの対応が必要です")
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(2)
                HStack(spacing: 8) {
                    PrimaryButton("対応した・再開") {
                        TaskRunnerBridge.shared.reply(to: session.id, message: "")
                    }
                    SecondaryButton("返信…") {
                        TaskRunnerBridge.shared.replyTarget = session.id
                        state.view = .task
                    }
                    SecondaryButton("停止") {
                        TaskRunnerBridge.shared.cancel(session.id)
                        state.view = .overview
                    }
                }
            }
            .padding(.leading, 116)
            .padding(.trailing, 16)
            .padding(.vertical, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct RunnerErrorView: View {
    @ObservedObject var state: AppState
    let session: TaskSession

    var body: some View {
        ZStack {
            CardBackground(wash: .red)
            VStack(alignment: .leading, spacing: 5) {
                AgentWho(task: state.focusTask, label: "タスクが止まりました")
                Text(session.detail?.components(separatedBy: "\n").first ?? "失敗しました")
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#FF8D97"))
                    .lineLimit(2)
                HStack(spacing: 8) {
                    PrimaryButton("再試行") {
                        TaskRunnerBridge.shared.reply(
                            to: session.id,
                            message: "前回は途中で止まりました（\(session.detail?.components(separatedBy: "\n").first ?? "原因不明")）。原因を調べて、最終ゴールまで続けてください。")
                    }
                    SecondaryButton("指示を追加…") {
                        TaskRunnerBridge.shared.replyTarget = session.id
                        state.view = .task
                    }
                    SecondaryButton("閉じる") {
                        TaskRunnerBridge.shared.dismiss(agentTaskId: session.agentTaskId)
                        state.view = .overview
                    }
                }
            }
            .padding(.leading, 116)
            .padding(.trailing, 16)
            .padding(.vertical, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct RunnerFinishedView: View {
    @ObservedObject var state: AppState
    let session: TaskSession

    var body: some View {
        ZStack {
            CardBackground(wash: .green)
            VStack(alignment: .leading, spacing: 5) {
                AgentWho(task: state.focusTask,
                         label: session.verified == true ? "完了しました（検証済み）" : "完了しました")
                Text(session.detail ?? session.prompt)
                    .font(.system(size: 13.5, weight: .semibold))
                    .lineLimit(2)
                HStack(spacing: 8) {
                    PrimaryButton("フォルダを開く") {
                        NSWorkspace.shared.open(URL(fileURLWithPath: session.cwd))
                    }
                    SecondaryButton("続けて指示…") {
                        TaskRunnerBridge.shared.replyTarget = session.id
                        state.view = .task
                    }
                    SecondaryButton("OK") {
                        TaskRunnerBridge.shared.dismiss(agentTaskId: session.agentTaskId)
                        NotificationCenter.default.post(name: .islandCollapse, object: nil)
                    }
                }
            }
            .padding(.leading, 116)
            .padding(.trailing, 16)
            .padding(.vertical, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
