import KanbanBoard from '../components/kanban/KanbanBoard.jsx'
import { useProspects } from '../contexts/ProspectContext.jsx'
import { STATUS_LIST, STATUS_DOT } from '../lib/utils.js'

export default function Kanban() {
  const { prospects } = useProspects()

  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        {STATUS_LIST.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[s] }} />
            <span className="text-xs text-gray-400">{s}</span>
            <span className="text-xs font-semibold text-white">{counts[s]}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-600">
        カードをドラッグしてステータスを変更できます
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard />
      </div>
    </div>
  )
}
