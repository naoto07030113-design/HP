'use client'

import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Staff, ShiftFormData, ShiftType } from '@/types/clinic'
import { SHIFT_TYPE_LABELS } from '@/types/clinic'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  staff: Staff[]
  clinicId: string
  onApply: (shifts: ShiftFormData[]) => void
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']
const DEFAULT_DAYS = [true, true, true, true, true, true, false]

export function BulkShiftDialog({ open, onOpenChange, weekStart, staff, clinicId, onApply }: Props) {
  const clinicStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)

  const [shiftType, setShiftType] = useState<ShiftType>('work')
  const [startTime, setStartTime] = useState('09:30')
  const [endTime, setEndTime] = useState('20:30')
  const [breakStart, setBreakStart] = useState('13:00')
  const [breakEnd, setBreakEnd] = useState('14:00')
  const [selectedDays, setSelectedDays] = useState(DEFAULT_DAYS)
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(
    new Set(clinicStaff.map((s) => s.id)),
  )

  function toggleDay(idx: number) {
    setSelectedDays((prev) => prev.map((v, i) => i === idx ? !v : v))
  }

  function toggleStaff(id: string) {
    setSelectedStaff((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleApply() {
    const result: ShiftFormData[] = []
    const isWork = shiftType === 'work'

    clinicStaff
      .filter((s) => selectedStaff.has(s.id))
      .forEach((s) => {
        selectedDays.forEach((selected, idx) => {
          if (!selected) return
          const date = format(addDays(weekStart, idx), 'yyyy-MM-dd')
          result.push({
            staff_id: s.id,
            clinic_id: clinicId,
            work_date: date,
            shift_type: shiftType,
            start_time: isWork ? startTime : '',
            end_time: isWork ? endTime : '',
            break_start: isWork ? (breakStart || null) : null,
            break_end: isWork ? (breakEnd || null) : null,
          })
        })
      })

    onApply(result)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>一括シフト入力</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* シフト種別 */}
          <div className="space-y-1.5">
            <Label>シフト種別</Label>
            <Select value={shiftType} onValueChange={(v) => setShiftType(v as ShiftType)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(SHIFT_TYPE_LABELS) as [ShiftType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 時間入力（出勤のみ） */}
          {shiftType === 'work' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>勤務時間</Label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 w-32" />
                  <span className="text-muted-foreground">〜</span>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 w-32" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>休憩時間</Label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className="h-9 w-32" />
                  <span className="text-muted-foreground">〜</span>
                  <Input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className="h-9 w-32" />
                </div>
              </div>
            </div>
          )}

          {/* 曜日選択 */}
          <div className="space-y-1.5">
            <Label>適用する曜日</Label>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-colors border-2
                    ${selectedDays[idx]
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                    }
                    ${idx === 5 ? 'text-blue-600' : ''}
                    ${idx === 6 ? 'text-red-500' : ''}
                    ${selectedDays[idx] ? 'text-white' : ''}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* スタッフ選択 */}
          <div className="space-y-1.5">
            <Label>適用するスタッフ</Label>
            <div className="space-y-1.5">
              {clinicStaff.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedStaff.has(s.id)}
                    onChange={() => toggleStaff(s.id)}
                    className="w-4 h-4 rounded accent-green-700"
                  />
                  <span className="text-sm font-medium group-hover:text-green-800">{s.name}</span>
                  {s.role && <span className="text-xs text-muted-foreground">{s.role}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={selectedStaff.size === 0 || !selectedDays.some(Boolean)}
          >
            一括適用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
