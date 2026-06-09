'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import type { Reservation, Staff, Menu, Clinic } from '@/types/clinic'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'

// ── 定数 ───────────────────────────────────────────────
const SLOT_MIN = 30     // スロット単位（分）
const SLOT_W = 60       // 1スロットの横幅（px）
const ROW_H = 76        // 1スタッフ行の高さ（px）
const STAFF_COL_W = 148 // スタッフ名列の幅（px）
const HEADER_H = 40     // 時間ヘッダーの高さ（px）

// ── ユーティリティ ──────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
function buildDropId(staffId: string, time: string) { return `${staffId}::${time}` }
function parseDropId(id: string) {
  const [staffId, time] = id.split('::')
  return staffId && time ? { staffId, time } : null
}

// ── ドロップ可能スロット ────────────────────────────────
function DroppableSlot({
  staffId, time, slotW, openMinutes, rowH, onClick,
}: {
  staffId: string; time: string; slotW: number; openMinutes: number
  rowH: number; onClick?: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: buildDropId(staffId, time) })
  const left = ((timeToMinutes(time) - openMinutes) / SLOT_MIN) * slotW

  return (
    <div
      ref={setNodeRef}
      style={{ position: 'absolute', top: 0, left, width: slotW, height: rowH }}
      onClick={() => onClick?.()}
      className={cn(
        'border-l border-dashed border-green-100 hover:bg-green-50/60 transition-colors cursor-pointer',
        isOver && 'bg-green-100/80',
      )}
    />
  )
}

// ── 予約カード ──────────────────────────────────────────
function ReservationCard({
  reservation, menus, openMinutes, slotW, rowH, onClick, isDragging,
}: {
  reservation: Reservation; menus: Menu[]; openMinutes: number
  slotW: number; rowH: number; onClick?: () => void; isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: reservation.id,
    data: reservation,
  })

  const startMin = timeToMinutes(format(parseISO(reservation.start_at), 'HH:mm'))
  const endMin = timeToMinutes(format(parseISO(reservation.end_at), 'HH:mm'))
  const durationMin = endMin - startMin

  const left = ((startMin - openMinutes) / SLOT_MIN) * slotW
  const width = Math.max((durationMin / SLOT_MIN) * slotW - 4, 24)
  const top = 4
  const height = rowH - 8

  const menu = menus.find((m) => m.id === reservation.menu_id)

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const statusClass = {
    confirmed: 'res-confirmed',
    visited: 'res-visited',
    cancelled: 'res-cancelled',
    no_show: 'res-no_show',
  }[reservation.status]

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, position: 'absolute', left, top, width, height, zIndex: isDragging ? 50 : 10 }}
      data-dragging={isDragging}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={cn(
        'rounded-md px-2 py-1 overflow-hidden cursor-grab select-none touch-none',
        'shadow-sm hover:shadow-md transition-shadow text-[11px] leading-tight flex flex-col justify-center',
        statusClass,
        isDragging && 'opacity-50',
      )}
    >
      <div className="font-semibold truncate">{reservation.patient_name}</div>
      {menu && durationMin >= 60 && <div className="truncate opacity-75">{menu.name}</div>}
      <div className="opacity-70 text-[10px]">
        {format(parseISO(reservation.start_at), 'HH:mm')}–{format(parseISO(reservation.end_at), 'HH:mm')}
      </div>
    </div>
  )
}

// ── メインコンポーネント ────────────────────────────────
interface Props {
  date: string
  clinic: Clinic
  staff: Staff[]
  reservations: Reservation[]
  menus: Menu[]
  onReservationClick: (r: Reservation) => void
  onSlotClick: (staffId: string, time: string) => void
  onReservationMove: (id: string, newStaffId: string, newStartAt: string, newEndAt: string) => void
  onAddClick: () => void
}

export function DayCalendar({
  date, clinic, staff, reservations, menus,
  onReservationClick, onSlotClick, onReservationMove, onAddClick,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const openMin = timeToMinutes(clinic.open_time)
  const closeMin = timeToMinutes(clinic.close_time)
  const totalMin = closeMin - openMin
  const slotCount = totalMin / SLOT_MIN
  const totalW = slotCount * SLOT_W

  const displayStaff = staff.filter((s) => s.clinic_id === clinic.id && s.is_active && s.is_bookable)

  // 時間スロット一覧
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let m = openMin; m < closeMin; m += SLOT_MIN) slots.push(minutesToTime(m))
    return slots
  }, [openMin, closeMin])

  // 時刻ラベル（1時間ごと）
  const hourLabels = useMemo(() => {
    const labels: string[] = []
    for (let m = openMin; m <= closeMin; m += 60) labels.push(minutesToTime(m))
    return labels
  }, [openMin, closeMin])

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.start_at.startsWith(date) && r.status !== 'cancelled'),
    [reservations, date],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
  )

  const activeReservation = activeId ? reservations.find((r) => r.id === activeId) : null

  function handleDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { over, active } = e
    if (!over) return
    const res = reservations.find((r) => r.id === String(active.id))
    if (!res) return
    const slot = parseDropId(String(over.id))
    if (!slot) return
    const durationMin = differenceInMinutes(parseISO(res.end_at), parseISO(res.start_at))
    const newStartAt = new Date(`${date}T${slot.time}:00`).toISOString()
    const newEndAt = new Date(new Date(`${date}T${slot.time}:00`).getTime() + durationMin * 60 * 1000).toISOString()
    onReservationMove(res.id, slot.staffId, newStartAt, newEndAt)
  }

  if (displayStaff.length === 0) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">この院のスタッフが登録されていません</div>
  }

  const totalH = displayStaff.length * ROW_H

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-auto flex-1 select-none">
        {/* 最小幅を確保してPC/タブレット向けに横展開 */}
        <div style={{ minWidth: STAFF_COL_W + totalW + 32 }}>

          {/* ── ヘッダー行（時間軸）── */}
          <div
            className="sticky top-0 z-20 flex bg-white border-b-2 border-green-200 shadow-sm"
            style={{ height: HEADER_H }}
          >
            {/* スタッフ列ヘッダー */}
            <div
              className="sticky left-0 z-30 bg-white border-r-2 border-green-200 flex items-center px-3 flex-shrink-0"
              style={{ width: STAFF_COL_W }}
            >
              <button
                onClick={onAddClick}
                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                予約追加
              </button>
            </div>

            {/* 時間ラベル（相対位置） */}
            <div className="relative flex-1" style={{ height: HEADER_H }}>
              {hourLabels.map((t) => {
                const left = ((timeToMinutes(t) - openMin) / SLOT_MIN) * SLOT_W
                const isLast = t === minutesToTime(closeMin)
                return (
                  <div
                    key={t}
                    style={{ position: 'absolute', left: left - 1, top: 0, height: HEADER_H }}
                    className="flex flex-col items-start"
                  >
                    <div className="w-px h-full bg-green-200" />
                    {!isLast && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 left-1 text-[11px] font-semibold text-green-700 whitespace-nowrap"
                      >
                        {t}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── スタッフ行グリッド ── */}
          <div className="flex flex-col">
            {displayStaff.map((s, sIdx) => {
              const staffRes = dayReservations.filter((r) => r.staff_id === s.id)
              const isLast = sIdx === displayStaff.length - 1

              return (
                <div
                  key={s.id}
                  className={cn('flex', !isLast && 'border-b border-green-100')}
                  style={{ height: ROW_H }}
                >
                  {/* スタッフ名（sticky left） */}
                  <div
                    className="sticky left-0 z-10 bg-white border-r-2 border-green-200 flex flex-col justify-center px-3 flex-shrink-0"
                    style={{ width: STAFF_COL_W }}
                  >
                    <p className="font-semibold text-green-900 text-sm leading-tight truncate">{s.name}</p>
                    {s.role && <p className="text-[11px] text-muted-foreground leading-tight truncate">{s.role}</p>}
                    <p className="text-[11px] text-green-600 leading-tight mt-0.5">{staffRes.length}件</p>
                  </div>

                  {/* タイムライン（横方向） */}
                  <div className="relative flex-shrink-0" style={{ width: totalW, height: ROW_H }}>
                    {/* 背景グリッド線 */}
                    {timeSlots.map((t) => {
                      const isHour = t.endsWith(':00')
                      const left = ((timeToMinutes(t) - openMin) / SLOT_MIN) * SLOT_W
                      return (
                        <div
                          key={t}
                          style={{ position: 'absolute', top: 0, left, width: SLOT_W, height: ROW_H }}
                          className={cn(
                            'border-l',
                            isHour ? 'border-green-200 bg-transparent' : 'border-dashed border-green-100',
                          )}
                        />
                      )
                    })}

                    {/* ドロップスロット */}
                    {timeSlots.map((t) => (
                      <DroppableSlot
                        key={t}
                        staffId={s.id}
                        time={t}
                        slotW={SLOT_W}
                        openMinutes={openMin}
                        rowH={ROW_H}
                        onClick={() => onSlotClick(s.id, t)}
                      />
                    ))}

                    {/* 予約カード */}
                    {staffRes.map((r) => (
                      <ReservationCard
                        key={r.id}
                        reservation={r}
                        menus={menus}
                        openMinutes={openMin}
                        slotW={SLOT_W}
                        rowH={ROW_H}
                        onClick={() => onReservationClick(r)}
                        isDragging={activeId === r.id}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 現在時刻ライン ── */}
          <CurrentTimeLine openMin={openMin} closeMin={closeMin} slotW={SLOT_W} staffColW={STAFF_COL_W} totalH={totalH + HEADER_H} date={date} />
        </div>
      </div>

      {/* DragOverlay */}
      <DragOverlay>
        {activeReservation && (
          <div className={cn('rounded-md px-2 py-1.5 text-xs shadow-xl opacity-90 min-w-[100px]', 'res-confirmed')}>
            <div className="font-semibold">{activeReservation.patient_name}</div>
            <div>{menus.find((m) => m.id === activeReservation.menu_id)?.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ── 現在時刻ライン ──────────────────────────────────────
function CurrentTimeLine({
  openMin, closeMin, slotW, staffColW, totalH, date,
}: {
  openMin: number; closeMin: number; slotW: number; staffColW: number; totalH: number; date: string
}) {
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  if (date !== todayStr) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin < openMin || nowMin > closeMin) return null

  const left = staffColW + ((nowMin - openMin) / SLOT_MIN) * slotW

  return (
    <div
      style={{ position: 'absolute', top: HEADER_H, left, width: 2, height: totalH - HEADER_H, zIndex: 30 }}
      className="pointer-events-none"
    >
      <div className="w-full h-full bg-red-400 opacity-70" />
      <div
        className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-red-500"
        style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }}
      />
    </div>
  )
}
