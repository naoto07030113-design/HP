import Foundation

// MARK: - TaskStore
// Persists TaskSessions and recently used project folders as JSON in the support directory.
// Foundation only. Main-actor isolated: every caller is the runner on the main actor.

@MainActor
final class TaskStore {
    private(set) var sessions: [TaskSession] = []
    private(set) var recentProjects: [String] = []

    private let fileURL: URL
    private let maxSessions = 50
    private let maxRecent = 8

    init(directory: URL) {
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        fileURL = directory.appendingPathComponent("tasks.json")
        load()
    }

    private struct Snapshot: Codable {
        var sessions: [TaskSession]
        var recentProjects: [String]
    }

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let snap = try? decoder.decode(Snapshot.self, from: data) else { return }
        sessions = snap.sessions
        recentProjects = snap.recentProjects
        // Processes do not survive an app restart (in-process runner MVP):
        // anything that was still running is marked failed so it can be retried.
        let now = Date()
        for i in sessions.indices where sessions[i].status.isRunning {
            sessions[i].status = .failed
            sessions[i].pid = nil
            sessions[i].finishedAt = now
            sessions[i].detail = "Coucou が終了したため中断されました。再試行できます。"
        }
    }

    private func save() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(Snapshot(sessions: sessions, recentProjects: recentProjects)) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    func session(id: UUID) -> TaskSession? {
        sessions.first { $0.id == id }
    }

    func upsert(_ session: TaskSession) {
        if let idx = sessions.firstIndex(where: { $0.id == session.id }) {
            sessions[idx] = session
        } else {
            sessions.append(session)
            if sessions.count > maxSessions {
                // Drop the oldest finished ones first; never drop a live task.
                if let drop = sessions.firstIndex(where: { $0.status.isTerminal }) {
                    sessions.remove(at: drop)
                }
            }
        }
        save()
    }

    func noteProject(_ path: String) {
        recentProjects.removeAll { $0 == path }
        recentProjects.insert(path, at: 0)
        if recentProjects.count > maxRecent { recentProjects.removeLast(recentProjects.count - maxRecent) }
        save()
    }
}
