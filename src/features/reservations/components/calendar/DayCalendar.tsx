'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import type { Reservation, Staff, Menu, Clinic } from '@/types/clinic'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Plus } from 'lucide-react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'

const SLOT_MIN = 30     // 30分単位
const SLOT_H = 52       // px per slot
const HEADER_H = 48     // px for header row
const TIME_COL_W = 52   // px for time column

interface TimeSlotId {
  staffId: string
  time: string  // "HH:mm"
}

function parseDropId(id: string): TimeSlotId | null {
  const [staffId, time] = id.split('::')
  if (!staffId || !time) return null
  return { staffId, time }
}

function buildDropId(staffId: string, time: string) {
  return `${staffId}::${time}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// カード 1枚
function ReservationCard({
  reservation, menus, slotMin, slotH, openMinutes,
  onClick, isDragging,
}: {
  reservation: Reservation
  menus: Menu[]
  slotMin: number
  slotH: number
  openMinutes: number
  onClick?: () => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: reservation.id,
    data: reservation,
  })

  const startMin = differenceInMinutes(parseISO(reservation.start_at), new Date(parseISO(reservation.start_at).toDateString()))
  const endMin = differenceInMinutes(parseISO(reservation.end_at), new Date(parseISO(reservation.end_at).toDateString()))
  const durationMin = endMin - startMin

  const top = ((startMin - openMinutes) / slotMin) * slotH
  const height = Math.max((durationMin / slotMin) * slotH, 24)

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
      style={{ ...style, top, height, position: 'absolute', left: 2, right: 2, zIndex: isDragging ? 50 : 10 }}
      data-dragging={isDragging}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={cn(
        'rounded-md px-1.5 py-1 overflow-hidden cursor-grab select-none touch-none',
        'shadow-sm hover:shadow-md transition-shadow text-[11px] leading-tight',
        statusClass,
        isDragging && 'opacity-50',
      )}
    >
      <div className="font-semibold truncate">{reservation.patient_name}</div>
      {menu && <div className="truncate opacity-80">{menu.name}</div>}
      <div className="opacity-70">
        {format(parseISO(reservation.start_at), 'HH:mm')} - {format(parseISO(reservation.end_at), 'HH:mm')}
      </div>
    </div>
  )
}

// ドロップ可能スロット
function DroppableSlot({
  staffId, time, slotH, openMinutes,
  onClick,
}: {
  staffId: string
  time: string
  slotH: number
  openMinutes: number
  onClick?: () => void
}) {
  const id = buildDropId(staffId, time)
  const { isOver, setNodeRef } = useDroppable({ id })
  const slotMinutes = timeToMinutes(time)
  const top = ((slotMinutes - openMinutes) / SLOT_MIN) * slotH

  return (
    <div
      ref={setNodeRef}
      style={{ top, height: slotH, position: 'absolute', left: 0, right: 0 }}
      onClick={() => onClick?.()}
      className={cn(
        'border-t border-dashed border-green-100 hover:bg-green-50/50 transition-colors cursor-pointer',
        isOver && 'bg-green-100/70',
      )}
    />
  )
}

interface Props {
  date: string  // "yyyy-MM-dd"
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
  const totalH = slotCount * SLOT_H

  // 表示対象スタッフ（当該院・アクティブ・予約受付可）
  const displayStaff = staff.filter((s) => s.clinic_id === clinic.id && s.is_active && s.is_bookable)

  // タイムスロット一覧
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let m = openMin; m < closeMin; m += SLOT_MIN) {
      slots.push(minutesToTime(m))
    }
    return slots
  }, [openMin, closeMin])

  // 日付に合う予約
  const dayReservations = useMemo(
    () => reservations.filter((r) => r.start_at.startsWith(date) && r.status !== 'cancelled'),
    [reservations, date],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
  )

  const activeReservation = activeId ? reservations.find((r) => r.id === activeId) : null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

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
    const newEndAt = new Date(
      new Date(`${date}T${slot.time}:00`).getTime() + durationMin * 60 * 1000,
    ).toISOString()
    onReservationMove(res.id, slot.staffId, newStartAt, newEndAt)
  }

  if (displayStaff.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        この院のスタッフが登録されていません
      </div>
    )
  }

  const colW = `${Math.max(160, Math.floor((100 - 8) / displayStaff.length))}px`

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-auto flex-1">
        {/* ヘッダー行 */}
        <div
          className="sticky top-0 z-20 flex bg-white border-b border-green-100 shadow-sm"
          style={{ paddingLeft: TIME_COL_W }}
        >
          {displayStaff.map((s) => (
            <div
              key={s.id}
              style={{ width: colW, minWidth: 140, flexShrink: 0 }}
              className="py-3 px-2 text-center border-l border-green-100"
            >
              <p className="font-semibold text-green-900 text-sm">{s.name}</p>
              {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
              <p className="text-xs text-green-600 mt-0.5">
                {dayReservations.filter((r) => r.staff_id === s.id).length}件
              </p>
            </div>
          ))}
          {/* 追加ボタン */}
          <div className="py-2 px-2 flex items-center border-l border-green-100">
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 px-2 py-1.5 rounded-md hover:bg-green-50 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              予約追加
            </button>
          </div>
        </div>

        {/* グリッド本体 */}
        <div className="flex" style={{ minHeight: totalH }}>
          {/* 時間軸 */}
          <div style={{ width: TIME_COL_W, flexShrink: 0 }} className="relative">
            {timeSlots.map((t) => {
              const isHour = t.endsWith(':00')
              const top = ((timeToMinutes(t) - openMin) / SLOT_MIN) * SLOT_H
              return (
                <div
                  key={t}
                  style={{ position: 'absolute', top: top - 8, left: 0, right: 0 }}
                  className={cn('flex items-start justify-end pr-2', !isHour && 'opacity-0')}
                >
                  <span className="text-[11px] text-muted-foreground leading-none">{t}</span>
                </div>
              )
            })}
            {/* 横線 */}
            {timeSlots.map((t) => {
              const isHour = t.endsWith(':00')
              const top = ((timeToMinutes(t) - openMin) / SLOT_MIN) * SLOT_H
              return (
                <div
                  key={`line-${t}`}
                  style={{ position: 'absolute', top, left: 0, right: 0, height: SLOT_H }}
                  className={cn(
                    'border-t',
                    isHour ? 'border-green-200' : 'border-dashed border-green-100',
                  )}
                />
              )
            })}
          </div>

          {/* スタッフ列 */}
          {displayStaff.map((s) => {
            const staffRes = dayReservations.filter((r) => r.staff_id === s.id)
            return (
              <div
                key={s.id}
                style={{ width: colW, minWidth: 140, flexShrink: 0, height: totalH, position: 'relative' }}
                className="border-l border-green-100"
              >
                {/* ドロップスロット */}
                {timeSlots.map((t) => (
                  <DroppableSlot
                    key={t}
                    staffId={s.id}
                    time={t}
                    slotH={SLOT_H}
                    openMinutes={openMin}
                    onClick={() => onSlotClick(s.id, t)}
                  />
                ))}
                {/* 予約カード */}
                {staffRes.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    menus={menus}
                    slotMin={SLOT_MIN}
                    slotH={SLOT_H}
                    openMinutes={openMin}
                    onClick={() => onReservationClick(r)}
                    isDragging={activeId === r.id}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeReservation && (
          <div className={cn('rounded-md px-2 py-1.5 text-xs shadow-lg opacity-90 min-w-[120px]', 'res-confirmed')}>
            <div className="font-semibold">{activeReservation.patient_name}</div>
            <div>{menus.find((m) => m.id === activeReservation.menu_id)?.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
