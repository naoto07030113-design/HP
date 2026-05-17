import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import type { Reservation, Staff } from '@/types'

const statusColor: Record<Reservation['status'], string> = {
  booked: 'bg-emerald-100 border-emerald-300',
  visited: 'bg-blue-100 border-blue-300',
  cancelled: 'bg-gray-200 border-gray-300',
  noshow: 'bg-rose-100 border-rose-300',
  block: 'bg-amber-100 border-amber-300',
}

const pxPerMin = 1.4

export function ReservationBoard({
  staffs,
  reservations,
  onDragEnd,
}: {
  staffs: Staff[]
  reservations: Reservation[]
  onDragEnd: (event: DragEndEvent) => void
}) {
  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {staffs.map((staff) => (
          <section key={staff.id} className="rounded-2xl border bg-white/70 p-4 shadow-glass backdrop-blur">
            <h3 className="mb-3 font-semibold text-forest">{staff.name}</h3>
            <div className="relative h-[800px] rounded-xl bg-slate-50 p-2">
              {reservations.filter((r) => r.staffId === staff.id).map((r) => {
                const s = new Date(r.startAt)
                const e = new Date(r.endAt)
                const top = (s.getHours() * 60 + s.getMinutes() - 9 * 60) * pxPerMin
                const height = (e.getTime() - s.getTime()) / 60000 * pxPerMin
                return (
                  <motion.div key={r.id} layout className={`absolute left-2 right-2 rounded-xl border p-2 text-xs ${statusColor[r.status]}`} style={{ top, height }}>
                    <p className="font-semibold">{r.patientName}</p>
                    <p>{r.menuName} / {r.rank}</p>
                    <p>{s.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - {e.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  </motion.div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </DndContext>
  )
}
