'use client'

import { useMemo } from 'react'
import { format, addDays, parseISO, startOfWeek, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Reservation, Staff, Menu, Clinic } from '@/types/clinic'
import { cn } from '@/lib/utils'

interface Props {
  weekStart: Date
  clinic: Clinic
  staff: Staff[]
  reservations: Reservation[]
  menus: Menu[]
  onDateClick: (date: string) => void
  onReservationClick: (r: Reservation) => void
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const DAY_COLORS = ['text-red-600', '', '', '', '', '', 'text-blue-600']

export function WeekCalendar({
  weekStart, clinic, staff, reservations, menus, onDateClick, onReservationClick,
}: Props) {
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const displayStaff = staff.filter((s) => s.clinic_id === clinic.id && s.is_active)
  const today = new Date()

  // staff × day でグルーピング
  const resMap = useMemo(() => {
    const map = new Map<string, Reservation[]>()
    reservations.forEach((r) => {
      if (r.status === 'cancelled') return
      const date = r.start_at.slice(0, 10)
      const key = `${r.staff_id ?? ''}::${date}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return map
  }, [reservations])

  if (displayStaff.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        この院のスタッフが登録されていません
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr className="bg-green-50">
            <th className="w-32 px-3 py-3 text-left text-green-900 font-semibold border-b border-green-100 sticky left-0 bg-green-50 z-10">
              スタッフ
            </th>
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const isToday = isSameDay(day, today)
              return (
                <th
                  key={dateStr}
                  className={cn(
                    'px-2 py-3 text-center border-b border-green-100 border-l cursor-pointer hover:bg-green-100 transition-colors',
                    isToday && 'bg-green-100',
                  )}
                  onClick={() => onDateClick(dateStr)}
                >
                  <div className={cn('text-xs font-medium', DAY_COLORS[idx])}>{DAY_LABELS[idx]}</div>
                  <div className={cn('text-base font-bold mt-0.5', isToday ? 'text-green-700' : 'text-gray-800', DAY_COLORS[idx])}>
                    {format(day, 'd')}
                  </div>
                  {isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-600 mx-auto mt-1" />}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {displayStaff.map((s) => (
            <tr key={s.id} className="hover:bg-green-50/40">
              <td className="px-3 py-2 border-b border-green-50 sticky left-0 bg-white z-10">
                <div className="font-medium text-green-900 text-sm">{s.name}</div>
                {s.role && <div className="text-xs text-muted-foreground">{s.role}</div>}
              </td>
              {days.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const key = `${s.id}::${dateStr}`
                const dayRes = resMap.get(key) ?? []
                const isToday = isSameDay(day, today)

                return (
                  <td
                    key={dateStr}
                    className={cn(
                      'px-1.5 py-1.5 border-b border-l border-green-50 align-top min-w-[100px] max-w-[140px]',
                      'cursor-pointer hover:bg-green-50/50 transition-colors',
                      isToday && 'bg-green-50/30',
                    )}
                    onClick={() => onDateClick(dateStr)}
                  >
                    {dayRes.length === 0 ? (
                      <div className="h-8 flex items-center justify-center text-muted-foreground/30 text-xs">
                        -
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {dayRes.slice(0, 3).map((r) => {
                          const menu = menus.find((m) => m.id === r.menu_id)
                          return (
                            <div
                              key={r.id}
                              onClick={(e) => { e.stopPropagation(); onReservationClick(r) }}
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[11px] leading-tight truncate cursor-pointer hover:opacity-80',
                                r.status === 'visited' ? 'res-visited' :
                                r.status === 'no_show' ? 'res-no_show' : 'res-confirmed',
                              )}
                            >
                              <div className="font-medium truncate">{r.patient_name}</div>
                              {menu && <div className="truncate opacity-75">{menu.name}</div>}
                            </div>
                          )
                        })}
                        {dayRes.length > 3 && (
                          <div className="text-[11px] text-green-700 font-medium pl-1">
                            +{dayRes.length - 3}件
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
