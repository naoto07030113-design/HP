'use client'

import { useState } from 'react'
import {
  format, addWeeks, subWeeks, startOfWeek, addDays,
  addMonths, subMonths, startOfMonth,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Copy, LayoutGrid } from 'lucide-react'
import { useClinicStore, shiftsStore } from '@/lib/clinic-store'
import { ShiftWeekGrid } from '@/features/shifts/components/ShiftWeekGrid'
import { ShiftMonthView } from '@/features/shifts/components/ShiftMonthView'
import { BulkShiftDialog } from '@/features/shifts/components/BulkShiftDialog'
import type { ShiftFormData } from '@/types/clinic'
import { cn } from '@/lib/utils'

type ViewMode = 'week' | 'month'

export default function ShiftsPage() {
  const store = useClinicStore()
  const [clinicId, setClinicId] = useState(store.clinics[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [bulkOpen, setBulkOpen] = useState(false)

  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${format(weekStart, 'yyyy年M月d日', { locale: ja })} 〜 ${format(weekEnd, 'M月d日（E）', { locale: ja })}`
  const monthLabel = format(monthStart, 'yyyy年M月', { locale: ja })

  function copyPreviousWeek() {
    const prevStart = subWeeks(weekStart, 1)
    const prevEnd = addDays(prevStart, 6)
    const prevFrom = format(prevStart, 'yyyy-MM-dd')
    const prevTo = format(prevEnd, 'yyyy-MM-dd')

    const prevShifts = store.shifts.filter(
      (s) => s.clinic_id === clinicId && s.work_date >= prevFrom && s.work_date <= prevTo,
    )
    prevShifts.forEach((shift) => {
      const newDate = format(addDays(new Date(shift.work_date), 7), 'yyyy-MM-dd')
      shiftsStore.upsert({
        staff_id: shift.staff_id,
        clinic_id: shift.clinic_id,
        work_date: newDate,
        shift_type: shift.shift_type ?? 'work',
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_start: shift.break_start,
        break_end: shift.break_end,
      })
    })
  }

  function handleBulkApply(shifts: ShiftFormData[]) {
    shifts.forEach((s) => shiftsStore.upsert(s))
  }

  // 月次ビューでセルクリック → 該当週の週次ビューへ
  function handleMonthDayClick(_staffId: string, dateStr: string) {
    const date = new Date(dateStr)
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
    setViewMode('week')
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">シフト管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">スタッフの勤務シフトを管理します</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={clinicId} onValueChange={setClinicId}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="院を選択" />
            </SelectTrigger>
            <SelectContent>
              {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ビュー切替 + ナビゲーション + アクション */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ビュー切替タブ */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'week' ? 'bg-green-800 text-white' : 'bg-white text-muted-foreground hover:bg-slate-50',
            )}
          >
            週次
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-l',
              viewMode === 'month' ? 'bg-green-800 text-white' : 'bg-white text-muted-foreground hover:bg-slate-50',
            )}
          >
            月次
          </button>
        </div>

        {/* 週/月ナビ */}
        {viewMode === 'week' ? (
          <>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              今週
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-green-900">{weekLabel}</span>
          </>
        ) : (
          <>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setMonthStart((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3"
              onClick={() => setMonthStart(startOfMonth(new Date()))}>
              今月
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setMonthStart((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-green-900">{monthLabel}</span>
          </>
        )}

        <div className="ml-auto flex gap-2">
          {viewMode === 'week' && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={copyPreviousWeek}>
              <Copy className="w-3.5 h-3.5" />
              前週コピー
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setBulkOpen(true)}>
            <LayoutGrid className="w-3.5 h-3.5" />
            一括入力
          </Button>
        </div>
      </div>

      {/* グリッド */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {viewMode === 'week' ? (
          <ShiftWeekGrid
            weekStart={weekStart}
            staff={store.staff}
            shifts={store.shifts}
            clinicId={clinicId}
            onUpsert={(data: ShiftFormData) => shiftsStore.upsert(data)}
            onDelete={(staffId, date) => shiftsStore.delete(staffId, date)}
          />
        ) : (
          <ShiftMonthView
            month={monthStart}
            staff={store.staff}
            shifts={store.shifts}
            clinicId={clinicId}
            onClickDay={handleMonthDayClick}
          />
        )}
      </div>

      {viewMode === 'week' && (
        <p className="text-xs text-muted-foreground">
          セルをクリックしてシフトを編集 / 月次ビューのセルをクリックするとその週に移動します
        </p>
      )}
      {viewMode === 'month' && (
        <p className="text-xs text-muted-foreground">
          セルをクリックするとその週の週次ビューに切り替わります
        </p>
      )}

      <BulkShiftDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        weekStart={viewMode === 'week' ? weekStart : startOfWeek(new Date(), { weekStartsOn: 1 })}
        staff={store.staff}
        clinicId={clinicId}
        onApply={handleBulkApply}
      />
    </div>
  )
}
