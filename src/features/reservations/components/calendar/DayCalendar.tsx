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
const SLOT_MIN = 30      // スロット単位（分）
const SLOT_W = 64        // 1スロット（30分）の横幅（px）
const PX_PER_MIN = SLOT_W / SLOT_MIN
const ROW_H = 72         // 1スタッフ行の高さ（px）
const STAFF_COL_W = 152  // スタッフ名列の幅（px）
const HEADER_H = 44      // 時間ヘッダーの高さ（px）

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
  staffId, time, openMinutes, rowH, onClick,
}: {
  staffId: string; time: string; openMinutes: number; rowH: number; onClick?: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: buildDropId(staffId, time) })
  const left = (timeToMinutes(time) - openMinutes) * PX_PER_MIN

  return (
    <div
      ref={setNodeRef}
      style={{ position: 'absolute', top: 0, left, width: SLOT_W, height: rowH }}
      onClick={() => onClick?.()}
      className={cn(
        'transition-colors cursor-pointer',
        isOver ? 'bg-emerald-100/70' : 'hover:bg-emerald-50/50',
      )}
    />
  )
}

// ── 予約カード ──────────────────────────────────────────
function ReservationCard({
  reservation, menus, openMinutes, rowH, onClick, isDragging,
}: {
  reservation: Reservation; menus: Menu[]; openMinutes: number
  rowH: number; onClick?: () => void; isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: reservation.id,
    data: reservation,
  })

  const startMin = timeToMinutes(format(parseISO(reservation.start_at), 'HH:mm'))
  const endMin = timeToMinutes(format(parseISO(reservation.end_at), 'HH:mm'))
  const durationMin = Math.max(endMin - startMin, SLOT_MIN)

  const left = (startMin - openMinutes) * PX_PER_MIN
  const width = Math.max(durationMin * PX_PER_MIN - 3, 26)
  const height = rowH - 10

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
      style={{ ...style, position: 'absolute', left: left + 1, top: 5, width, height, zIndex: isDragging ? 50 : 10 }}
      data-dragging={isDragging}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={cn(
        'rounded-lg px-2 py-1 overflow-hidden cursor-grab select-none touch-none',
        'shadow-sm hover:shadow-md hover:-translate-y-px transition-all text-[11px] leading-tight flex flex-col justify-center gap-0.5',
        statusClass,
        isDragging && 'opacity-50',
      )}
    >
      <div className="font-semibold truncate">{reservation.patient_name}</div>
      {menu && durationMin >= 60 && <div className="truncate opacity-70">{menu.name}</div>}
      <div className="opacity-60 text-[10px] tabular-nums">
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
  const totalMin = Math.max(closeMin - openMin, SLOT_MIN)
  const totalW = totalMin * PX_PER_MIN

  const displayStaff = staff.filter((s) => s.clinic_id === clinic.id && s.is_active && s.is_bookable)

  // 時間スロット一覧（30分刻み）
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let m = openMin; m < closeMin; m += SLOT_MIN) slots.push(minutesToTime(m))
    return slots
  }, [openMin, closeMin])

  // 時刻ラベル（1時間ごと）
  const hourMarks = useMemo(() => {
    const marks: number[] = []
    const firstHour = Math.ceil(openMin / 60) * 60
    for (let m = firstHour; m <= closeMin; m += 60) marks.push(m)
    return marks
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

  const rowsH = displayStaff.length * ROW_H

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-auto flex-1 select-none bg-stone-50/40">
        {/* 位置基準となる relative ラッパー（現在時刻ラインの基準） */}
        <div className="relative" style={{ minWidth: STAFF_COL_W + totalW }}>

          {/* ── ヘッダー行（時間軸）── */}
          <div
            className="sticky top-0 z-30 flex bg-white/95 backdrop-blur border-b border-stone-200"
            style={{ height: HEADER_H }}
          >
            {/* スタッフ列ヘッダー */}
            <div
              className="sticky left-0 z-40 bg-white border-r border-stone-200 flex items-center px-3 flex-shrink-0"
              style={{ width: STAFF_COL_W }}
            >
              <button
                onClick={onAddClick}
                className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-white hover:bg-emerald-700 border border-emerald-200 hover:border-emerald-700 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                予約追加
              </button>
            </div>

            {/* 時間ラベル（相対位置・1時間ごと） */}
            <div className="relative flex-shrink-0" style={{ width: totalW, height: HEADER_H }}>
              {hourMarks.map((m) => {
                const left = (m - openMin) * PX_PER_MIN
                return (
                  <div key={m} style={{ position: 'absolute', left, top: 0, height: HEADER_H }}>
                    <div className="absolute top-0 left-0 w-px h-full bg-stone-200" />
                    <span className="absolute top-1/2 -translate-y-1/2 left-1.5 text-[11px] font-semibold text-stone-500 tabular-nums whitespace-nowrap">
                      {minutesToTime(m)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── スタッフ行グリッド ── */}
          <div className="flex flex-col">
            {displayStaff.map((s, sIdx) => {
              const staffRes = dayReservations.filter((r) => r.staff_id === s.id)

              return (
                <div
                  key={s.id}
                  className={cn('flex border-b border-stone-100', sIdx % 2 === 1 && 'bg-stone-50/50')}
                  style={{ height: ROW_H }}
                >
                  {/* スタッフ名（sticky left） */}
                  <div
                    className="sticky left-0 z-20 bg-inherit border-r border-stone-200 flex flex-col justify-center px-3 flex-shrink-0"
                    style={{ width: STAFF_COL_W }}
                  >
                    <p className="font-semibold text-stone-800 text-sm leading-tight truncate">{s.name}</p>
                    {s.role && <p className="text-[11px] text-stone-400 leading-tight truncate">{s.role}</p>}
                    <p className="text-[11px] text-emerald-600 font-medium leading-tight mt-0.5">{staffRes.length}件</p>
                  </div>

                  {/* タイムライン（横方向） */}
                  <div className="relative flex-shrink-0" style={{ width: totalW, height: ROW_H }}>
                    {/* 背景グリッド線（実線=毎正時、点線=30分） */}
                    {timeSlots.map((t) => {
                      const isHour = t.endsWith(':00')
                      const left = (timeToMinutes(t) - openMin) * PX_PER_MIN
                      return (
                        <div
                          key={t}
                          style={{ position: 'absolute', top: 0, left, width: SLOT_W, height: ROW_H }}
                          className={cn('border-l', isHour ? 'border-stone-200' : 'border-dashed border-stone-100')}
                        />
                      )
                    })}

                    {/* ドロップスロット */}
                    {timeSlots.map((t) => (
                      <DroppableSlot
                        key={t}
                        staffId={s.id}
                        time={t}
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

          {/* ── 現在時刻ライン（relative ラッパー基準で正確に配置）── */}
          <CurrentTimeLine openMin={openMin} closeMin={closeMin} rowsH={rowsH} date={date} />
        </div>
      </div>

      {/* DragOverlay */}
      <DragOverlay>
        {activeReservation && (
          <div className={cn('rounded-lg px-2 py-1.5 text-xs shadow-xl opacity-95 min-w-[100px]', 'res-confirmed')}>
            <div className="font-semibold">{activeReservation.patient_name}</div>
            <div className="opacity-70">{menus.find((m) => m.id === activeReservation.menu_id)?.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ── 現在時刻ライン ──────────────────────────────────────
// relative なグリッドラッパー内に配置。left はスタッフ列幅 + 経過分。
// スタッフ列（sticky, z-20/40）より低い z-index にし、横スクロール時は列の裏に隠れる。
function CurrentTimeLine({
  openMin, closeMin, rowsH, date,
}: {
  openMin: number; closeMin: number; rowsH: number; date: string
}) {
  const now = new Date()
  if (date !== format(now, 'yyyy-MM-dd')) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin < openMin || nowMin > closeMin) return null

  const left = STAFF_COL_W + (nowMin - openMin) * PX_PER_MIN

  return (
    <div
      style={{ position: 'absolute', top: HEADER_H, left, width: 0, height: rowsH, zIndex: 15 }}
      className="pointer-events-none"
    >
      <div className="w-0.5 h-full bg-red-500/80" />
      <div
        className="absolute -top-1 -left-[5px] w-2.5 h-2.5 rounded-full bg-red-500"
        style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.18)' }}
      />
    </div>
  )
}
