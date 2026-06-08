'use client'

import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Staff, Shift, ShiftFormData, ShiftType } from '@/types/clinic'
import { SHIFT_TYPE_LABELS, SHIFT_TYPE_COLORS } from '@/types/clinic'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X, Plus } from 'lucide-react'

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']
const DAY_COLORS = ['', '', '', '', '', 'text-blue-600', 'text-red-500']

interface Props {
  weekStart: Date
  staff: Staff[]
  shifts: Shift[]
  clinicId: string
  onUpsert: (data: ShiftFormData) => void
  onDelete: (staffId: string, date: string) => void
}

const DEFAULT_FORM = {
  shift_type: 'work' as ShiftType,
  start_time: '09:30',
  end_time: '20:30',
  break_start: '13:00',
  break_end: '14:00',
}

function calcWorkHours(shift: Shift): number {
  if (shift.shift_type !== 'work') return 0
  const [sh, sm] = shift.start_time.split(':').map(Number)
  const [eh, em] = shift.end_time.split(':').map(Number)
  const total = (eh * 60 + em) - (sh * 60 + sm)
  const brk = shift.break_start && shift.break_end
    ? (() => {
        const [bsh, bsm] = shift.break_start!.split(':').map(Number)
        const [beh, bem] = shift.break_end!.split(':').map(Number)
        return (beh * 60 + bem) - (bsh * 60 + bsm)
      })()
    : 0
  return Math.max(0, (total - brk) / 60)
}

export function ShiftWeekGrid({ weekStart, staff, shifts, clinicId, onUpsert, onDelete }: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(DEFAULT_FORM)

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const shiftMap = useMemo(() => {
    const m = new Map<string, Shift>()
    shifts.forEach((s) => m.set(`${s.staff_id}::${s.work_date}`, s))
    return m
  }, [shifts])

  const displayStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)

  function startEdit(staffId: string, date: string) {
    const key = `${staffId}::${date}`
    const existing = shiftMap.get(key)
    setEditingKey(key)
    setEditForm(existing
      ? {
          shift_type: existing.shift_type ?? 'work',
          start_time: existing.start_time,
          end_time: existing.end_time,
          break_start: existing.break_start ?? '13:00',
          break_end: existing.break_end ?? '14:00',
        }
      : DEFAULT_FORM,
    )
  }

  function saveEdit(staffId: string, date: string) {
    const isWork = editForm.shift_type === 'work'
    onUpsert({
      staff_id: staffId,
      clinic_id: clinicId,
      work_date: date,
      shift_type: editForm.shift_type,
      start_time: isWork ? editForm.start_time : '',
      end_time: isWork ? editForm.end_time : '',
      break_start: isWork ? (editForm.break_start || null) : null,
      break_end: isWork ? (editForm.break_end || null) : null,
    })
    setEditingKey(null)
  }

  // 週計
  const weeklyHours = useMemo(() => {
    const m = new Map<string, number>()
    displayStaff.forEach((s) => {
      const total = days.reduce((sum, day) => {
        const shift = shiftMap.get(`${s.id}::${format(day, 'yyyy-MM-dd')}`)
        return sum + (shift ? calcWorkHours(shift) : 0)
      }, 0)
      m.set(s.id, total)
    })
    return m
  }, [displayStaff, days, shiftMap])

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-green-50">
            <th className="w-28 px-3 py-3 text-left text-green-900 font-semibold border-b border-green-100 sticky left-0 bg-green-50 z-10">
              スタッフ
            </th>
            {days.map((day, idx) => (
              <th key={idx} className="px-2 py-2.5 text-center border-b border-l border-green-100 min-w-[140px]">
                <span className={cn('text-xs font-medium', DAY_COLORS[idx])}>{DAY_LABELS[idx]}</span>
                <span className="text-xs text-muted-foreground ml-1">{format(day, 'M/d', { locale: ja })}</span>
              </th>
            ))}
            <th className="px-3 py-2.5 text-center border-b border-l border-green-100 text-xs text-muted-foreground w-16">
              週計
            </th>
          </tr>
        </thead>
        <tbody>
          {displayStaff.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2 border-b border-green-50 sticky left-0 bg-white z-10">
                <div className="font-medium text-green-900 text-sm">{s.name}</div>
                {s.role && <div className="text-xs text-muted-foreground">{s.role}</div>}
              </td>
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const key = `${s.id}::${dateStr}`
                const shift = shiftMap.get(key) ?? null
                const isEditing = editingKey === key

                return (
                  <td key={dateStr} className="border-b border-l border-green-50 p-1 align-top min-w-[140px]">
                    {isEditing ? (
                      <div className="space-y-1.5 p-1">
                        <Select
                          value={editForm.shift_type}
                          onValueChange={(v) => setEditForm((f) => ({ ...f, shift_type: v as ShiftType }))}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(SHIFT_TYPE_LABELS) as [ShiftType, string][]).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {editForm.shift_type === 'work' && (
                          <>
                            <div className="flex gap-1 items-center">
                              <Input
                                type="time" value={editForm.start_time}
                                onChange={(e) => setEditForm((f) => ({ ...f, start_time: e.target.value }))}
                                className="h-6 text-xs px-1 w-[76px]"
                              />
                              <span className="text-xs">〜</span>
                              <Input
                                type="time" value={editForm.end_time}
                                onChange={(e) => setEditForm((f) => ({ ...f, end_time: e.target.value }))}
                                className="h-6 text-xs px-1 w-[76px]"
                              />
                            </div>
                            <div className="flex gap-1 items-center">
                              <span className="text-[10px] text-muted-foreground w-7">休憩</span>
                              <Input
                                type="time" value={editForm.break_start}
                                onChange={(e) => setEditForm((f) => ({ ...f, break_start: e.target.value }))}
                                className="h-6 text-xs px-1 w-[72px]"
                              />
                              <span className="text-xs">〜</span>
                              <Input
                                type="time" value={editForm.break_end}
                                onChange={(e) => setEditForm((f) => ({ ...f, break_end: e.target.value }))}
                                className="h-6 text-xs px-1 w-[72px]"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex gap-1 mt-1">
                          <Button size="sm" className="h-6 px-2 text-xs" onClick={() => saveEdit(s.id, dateStr)}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setEditingKey(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                          {shift && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => { onDelete(s.id, dateStr); setEditingKey(null) }}
                            >
                              削除
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : shift ? (
                      <button
                        className="w-full text-left p-1.5 rounded hover:bg-green-50 transition-colors"
                        onClick={() => startEdit(s.id, dateStr)}
                      >
                        {shift.shift_type === 'work' ? (
                          <>
                            <div className="text-xs font-medium text-green-800">
                              {shift.start_time} - {shift.end_time}
                            </div>
                            {shift.break_start && (
                              <div className="text-[10px] text-muted-foreground">
                                休憩 {shift.break_start}-{shift.break_end}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                            SHIFT_TYPE_COLORS[shift.shift_type],
                          )}>
                            {SHIFT_TYPE_LABELS[shift.shift_type]}
                          </span>
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
              <td className="border-b border-l border-green-50 px-3 text-center text-xs font-semibold text-green-900">
                {(weeklyHours.get(s.id) ?? 0).toFixed(1)}h
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
