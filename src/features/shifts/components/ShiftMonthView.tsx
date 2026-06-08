'use client'

import { useMemo } from 'react'
import { format, getDaysInMonth, startOfMonth } from 'date-fns'
import type { Staff, Shift, ShiftType } from '@/types/clinic'
import { SHIFT_TYPE_SHORT, SHIFT_TYPE_COLORS } from '@/types/clinic'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

function getDayOfWeekLabel(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day).getDay()
  return (d + 6) % 7 // 0=月...6=日
}

function calcMonthHours(shifts: Shift[], staffId: string, year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return shifts
    .filter((s) => s.staff_id === staffId && s.work_date.startsWith(prefix) && s.shift_type === 'work')
    .reduce((sum, s) => {
      const [sh, sm] = s.start_time.split(':').map(Number)
      const [eh, em] = s.end_time.split(':').map(Number)
      const total = (eh * 60 + em) - (sh * 60 + sm)
      const brk = s.break_start && s.break_end
        ? (() => {
            const [bsh, bsm] = s.break_start!.split(':').map(Number)
            const [beh, bem] = s.break_end!.split(':').map(Number)
            return (beh * 60 + bem) - (bsh * 60 + bsm)
          })()
        : 0
      return sum + Math.max(0, (total - brk) / 60)
    }, 0)
}

interface Props {
  month: Date
  staff: Staff[]
  shifts: Shift[]
  clinicId: string
  onClickDay?: (staffId: string, date: string) => void
}

export function ShiftMonthView({ month, staff, shifts, clinicId, onClickDay }: Props) {
  const year = month.getFullYear()
  const monthNum = month.getMonth() + 1
  const daysInMonth = getDaysInMonth(month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const shiftMap = useMemo(() => {
    const m = new Map<string, Shift>()
    shifts.forEach((s) => m.set(`${s.staff_id}::${s.work_date}`, s))
    return m
  }, [shifts])

  const displayStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)

  return (
    <div className="overflow-auto">
      <table className="border-collapse text-xs w-full">
        <thead>
          <tr className="bg-green-50">
            <th className="sticky left-0 bg-green-50 z-10 px-3 py-2.5 text-left text-green-900 font-semibold border-b border-green-100 w-28 min-w-[112px]">
              スタッフ
            </th>
            {days.map((d) => {
              const dow = getDayOfWeekLabel(year, monthNum, d)
              return (
                <th key={d} className={cn(
                  'px-1 py-2 border-b border-l border-green-100 text-center min-w-[36px] w-9',
                  dow === 5 && 'bg-blue-50',
                  dow === 6 && 'bg-red-50',
                )}>
                  <div className={cn(
                    'text-[10px] font-medium leading-none',
                    dow === 5 ? 'text-blue-600' : dow === 6 ? 'text-red-500' : 'text-muted-foreground',
                  )}>
                    {DAY_LABELS[dow]}
                  </div>
                  <div className="font-semibold text-green-900 mt-0.5">{d}</div>
                </th>
              )
            })}
            <th className="px-2 py-2.5 text-center border-b border-l border-green-100 text-muted-foreground whitespace-nowrap min-w-[48px]">
              月計
            </th>
          </tr>
        </thead>
        <tbody>
          {displayStaff.map((s) => {
            const monthHours = calcMonthHours(shifts, s.id, year, monthNum)
            return (
              <tr key={s.id}>
                <td className="sticky left-0 bg-white z-10 px-3 py-1.5 border-b border-green-50">
                  <div className="font-medium text-green-900 text-sm">{s.name}</div>
                  {s.role && <div className="text-[10px] text-muted-foreground">{s.role}</div>}
                </td>
                {days.map((d) => {
                  const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const shift = shiftMap.get(`${s.id}::${dateStr}`)
                  const dow = getDayOfWeekLabel(year, monthNum, d)

                  return (
                    <td
                      key={d}
                      className={cn(
                        'border-b border-l border-green-50 p-0.5 text-center cursor-pointer hover:bg-green-50/70 transition-colors',
                        dow === 5 && 'bg-blue-50/30',
                        dow === 6 && 'bg-red-50/30',
                      )}
                      onClick={() => onClickDay?.(s.id, dateStr)}
                    >
                      {shift ? (
                        shift.shift_type === 'work' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-green-700 font-medium leading-none">
                              {shift.start_time.slice(0, 5)}
                            </span>
                            <span className="text-[9px] text-green-700 leading-none">
                              {shift.end_time.slice(0, 5)}
                            </span>
                          </div>
                        ) : (
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                            SHIFT_TYPE_COLORS[shift.shift_type],
                          )}>
                            {SHIFT_TYPE_SHORT[shift.shift_type]}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-200 text-xs">-</span>
                      )}
                    </td>
                  )
                })}
                <td className="border-b border-l border-green-50 px-2 text-center font-semibold text-green-900">
                  {monthHours.toFixed(1)}h
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
