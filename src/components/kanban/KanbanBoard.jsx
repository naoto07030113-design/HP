import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn.jsx'
import { STATUS_LIST } from '../../lib/utils.js'
import { useProspects } from '../../contexts/ProspectContext.jsx'

export default function KanbanBoard() {
  const { prospects, dispatch } = useProspects()

  function onDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    dispatch({
      type: 'UPDATE_STATUS',
      payload: { id: draggableId, status: destination.droppableId },
    })
  }

  const grouped = STATUS_LIST.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.status === s)
    return acc
  }, {})

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-0">
        {STATUS_LIST.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            prospects={grouped[status] || []}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
