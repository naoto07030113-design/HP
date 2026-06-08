'use client'

import { useState } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useClinicStore, shiftsStore } from '@/lib/clinic-store'
import { ShiftWeekGrid } from '@/features/shifts/components/ShiftWeekGrid'
import type { ShiftFormData } from '@/types/clinic'

export default function ShiftsPage() {
  const store = useClinicStore()
  const [clinicId, setClinicId] = useState(store.clinics[0]?.id ?? '')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${format(weekStart, 'yyyy年M月d日', { locale: ja })} 〜 ${format(weekEnd, 'M月d日（E）', { locale: ja })}`

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">シフト管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">スタッフの週次勤務シフトを入力します</p>
        </div>
        <Select value={clinicId} onValueChange={setClinicId}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="院を選択" />
          </SelectTrigger>
          <SelectContent>
            {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 週ナビ */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          今週
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-green-900">{weekLabel}</span>
      </div>

      {/* グリッド */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <ShiftWeekGrid
          weekStart={weekStart}
          staff={store.staff}
          shifts={store.shifts}
          clinicId={clinicId}
          onUpsert={(data: ShiftFormData) => shiftsStore.upsert(data)}
          onDelete={(staffId, date) => shiftsStore.delete(staffId, date)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        セルをクリックするとシフトを編集できます。チェックで保存、Xでキャンセルです。
      </p>
    </div>
  )
}
