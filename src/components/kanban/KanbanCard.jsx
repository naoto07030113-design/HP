import { Draggable } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import { getScoreColor, formatCurrency } from '../../lib/utils.js'

export default function KanbanCard({ prospect: p, index }) {
  const navigate = useNavigate()
  const scoreColor = getScoreColor(p.ai_score)

  return (
    <Draggable draggableId={p.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => navigate(`/prospects/${p.id}`)}
          className={`bg-surface-2 border rounded-lg p-3 cursor-pointer text-left
            transition-all duration-150 select-none
            ${snapshot.isDragging
              ? 'border-gold/40 shadow-lg shadow-gold/10 rotate-1 scale-105'
              : 'border-border hover:border-border-light'
            }`}
        >
          <div className="text-xs font-medium text-white leading-snug mb-1.5 line-clamp-2">
            {p.store_name}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{p.industry}</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor }}>
              {p.ai_score}pt
            </span>
          </div>

          {p.deal_value > 0 && (
            <div className="mt-1.5 text-xs text-gray-600">
              {formatCurrency(p.deal_value)}
            </div>
          )}

          {p.assigned_to && (
            <div className="mt-2 flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-gray-400">{p.assigned_to.slice(0, 1)}</span>
              </div>
              <span className="text-xs text-gray-600 truncate">{p.assigned_to}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
