'use client'

import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Staff, Shift, ShiftFormData } from '@/types/clinic'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Plus } from 'lucide-react'

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']
const DAY_COLORS = ['', '', '', '', '', 'text-blue-600', 'text-red-500']

interface ShiftCell {
  staffId: string
  date: string
  shift: Shift | null
  editing: boolean
  form: Omit<ShiftFormData, 'staff_id' | 'clinic_id' | 'work_date'>
}

interface Props {
  weekStart: Date
  staff: Staff[]
  shifts: Shift[]
  clinicId: string
  onUpsert: (data: ShiftFormData) => void
  onDelete: (staffId: string, date: string) => void
}

const DEFAULT_FORM = {
  start_time: '09:00',
  end_time: '18:00',
  break_start: '12:00',
  break_end: '13:00',
}

export function ShiftWeekGrid({ weekStart, staff, shifts, clinicId, onUpsert, onDelete }: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(DEFAULT_FORM)

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const shiftMap = useMemo(() => {
    const m = new Map<string, Shift>()
    shifts.forEach((s) => { m.set(`${s.staff_id}::${s.work_date}`, s) })
    return m
  }, [shifts])

  function startEdit(staffId: string, date: string) {
    const key = `${staffId}::${date}`
    const existing = shiftMap.get(key)
    setEditingKey(key)
    setEditForm(existing
      ? { start_time: existing.start_time, end_time: existing.end_time,
          break_start: existing.break_start ?? '12:00', break_end: existing.break_end ?? '13:00' }
      : DEFAULT_FORM,
    )
  }

  function saveEdit(staffId: string, date: string) {
    onUpsert({ staff_id: staffId, clinic_id: clinicId, work_date: date, ...editForm,
      break_start: editForm.break_start || null, break_end: editForm.break_end || null })
    setEditingKey(null)
  }

  const displayStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-green-50">
            <th className="w-28 px-3 py-3 text-left text-green-900 font-semibold border-b border-green-100 sticky left-0 bg-green-50 z-10">
              スタッフ
            </th>
            {days.map((day, idx) => (
              <th
                key={idx}
                className="px-2 py-2.5 text-center border-b border-l border-green-100 min-w-[130px]"
              >
                <span className={cn('text-xs font-medium', DAY_COLORS[idx])}>{DAY_LABELS[idx]}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {format(day, 'M/d')}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayStaff.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2 border-b border-green-50 sticky left-0 bg-white z-10">
                <div className="font-medium text-green-900">{s.name}</div>
                {s.role && <div className="text-xs text-muted-foreground">{s.role}</div>}
              </td>
              {days.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const key = `${s.id}::${dateStr}`
                const shift = shiftMap.get(key) ?? null
                const isEditing = editingKey === key

                return (
                  <td key={dateStr} className={cn('border-b border-l border-green-50 p-1 align-top', 'min-w-[130px]')}>
                    {isEditing ? (
                      <div className="space-y-1 p-1">
                        <div className="flex gap-1 items-center">
                          <Input
                            type="time" value={editForm.start_time}
                            onChange={(e) => setEditForm((f) => ({ ...f, start_time: e.target.value }))}
                            className="h-6 text-xs px-1 w-[80px]"
                          />
                          <span className="text-xs">〜</span>
                          <Input
                            type="time" value={editForm.end_time}
                            onChange={(e) => setEditForm((f) => ({ ...f, end_time: e.target.value }))}
                            className="h-6 text-xs px-1 w-[80px]"
                          />
                        </div>
                        <div className="flex gap-1 items-center">
                          <span className="text-[10px] text-muted-foreground w-8">休憩</span>
                          <Input
                            type="time" value={editForm.break_start}
                            onChange={(e) => setEditForm((f) => ({ ...f, break_start: e.target.value }))}
                            className="h-6 text-xs px-1 w-[75px]"
                          />
                          <span className="text-xs">〜</span>
                          <Input
                            type="time" value={editForm.break_end}
                            onChange={(e) => setEditForm((f) => ({ ...f, break_end: e.target.value }))}
                            className="h-6 text-xs px-1 w-[75px]"
                          />
                        </div>
                        <div className="flex gap-1 mt-1">
                          <Button size="sm" className="h-6 px-2 text-xs" onClick={() => saveEdit(s.id, dateStr)}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setEditingKey(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                          {shift && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => { onDelete(s.id, dateStr); setEditingKey(null) }}>
                              削除
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : shift ? (
                      <button
                        className="w-full text-left p-1.5 rounded hover:bg-green-50 transition-colors group"
                        onClick={() => startEdit(s.id, dateStr)}
                      >
                        <div className="text-xs font-medium text-green-800">
                          {shift.start_time} - {shift.end_time}
                        </div>
                        {shift.break_start && (
                          <div className="text-[10px] text-muted-foreground">
                            休憩 {shift.break_start}-{shift.break_end}
                          </div>
                        )}
                      </button>
                    ) : (
                      <button
                        className="w-full h-10 flex items-center justify-center text-muted-foreground/40 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        onClick={() => startEdit(s.id, dateStr)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
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
