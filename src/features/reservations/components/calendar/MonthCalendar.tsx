'use client'

import { useMemo } from 'react'
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, isToday } from 'date-fns'
import type { Reservation } from '@/types/clinic'

interface Props {
  month: Date
  clinicId: string
  reservations: Reservation[]
  onDateClick: (date: string) => void
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']

export function MonthCalendar({ month, clinicId, reservations, onDateClick }: Props) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
    )
  }, [month])

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of reservations) {
      if (clinicId && r.clinic_id !== clinicId) continue
      const date = r.start_at.slice(0, 10)
      map[date] = (map[date] ?? 0) + 1
    }
    return map
  }, [reservations, clinicId])

  return (
    <div className="flex flex-col h-full select-none">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-green-100 bg-green-50/50">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-600' : 'text-green-800'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="flex-1 grid grid-rows-6 divide-y divide-green-50 overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-green-50 min-h-0">
            {week.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const count = countByDate[dateStr] ?? 0
              const inMonth = isSameMonth(day, month)
              const today = isToday(day)
              const dow = day.getDay()

              return (
                <button
                  key={dateStr}
                  onClick={() => onDateClick(dateStr)}
                  className={`
                    relative flex flex-col items-start p-1 sm:p-2 text-left transition-colors
                    ${inMonth ? 'hover:bg-green-50 active:bg-green-100' : 'bg-gray-50/60 hover:bg-gray-100/60'}
                  `}
                >
                  <span
                    className={`
                      w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                      text-xs sm:text-sm font-medium leading-none
                      ${today
                        ? 'bg-green-700 text-white'
                        : !inMonth
                          ? 'text-gray-300'
                          : dow === 0
                            ? 'text-red-500'
                            : dow === 6
                              ? 'text-blue-600'
                              : 'text-green-900'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {count > 0 && inMonth && (
                    <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs bg-green-100 text-green-800 px-1 sm:px-1.5 py-0 sm:py-0.5 rounded-full font-semibold leading-5">
                      {count}件
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
