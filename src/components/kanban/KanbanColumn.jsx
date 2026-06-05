import { Droppable } from '@hello-pangea/dnd'
import KanbanCard from './KanbanCard.jsx'
import { STATUS_DOT } from '../../lib/utils.js'

export default function KanbanColumn({ status, prospects }) {
  const dot = STATUS_DOT[status] || '#6B7280'

  return (
    <div className="flex-shrink-0 w-52 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
        <span className="text-xs font-medium text-gray-300">{status}</span>
        <span
          className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: dot + '22', color: dot }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Cards */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-20 rounded-lg p-1 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-gold/5 border border-gold/20' : 'bg-transparent'
            }`}
          >
            {prospects.map((p, index) => (
              <KanbanCard key={p.id} prospect={p} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
