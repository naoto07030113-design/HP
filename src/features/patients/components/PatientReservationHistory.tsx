'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Reservation, Staff, Menu } from '@/types/clinic'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Calendar } from 'lucide-react'

interface Props {
  patientId: string
  reservations: Reservation[]
  staff: Staff[]
  menus: Menu[]
}

export function PatientReservationHistory({ patientId, reservations, staff, menus }: Props) {
  const history = useMemo(() =>
    reservations
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => (a.start_at > b.start_at ? -1 : 1)),
    [patientId, reservations],
  )

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Calendar className="w-10 h-10 mb-2 text-green-200" />
        <p className="text-sm">来院履歴がありません</p>
      </div>
    )
  }

  const visitedCount = history.filter((r) => r.status === 'visited').length

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <div className="bg-green-50 rounded-lg px-4 py-2 text-center">
          <p className="text-2xl font-bold text-green-800">{history.length}</p>
          <p className="text-muted-foreground text-xs">総予約数</p>
        </div>
        <div className="bg-gold-50 rounded-lg px-4 py-2 text-center">
          <p className="text-2xl font-bold text-gold-700">{visitedCount}</p>
          <p className="text-muted-foreground text-xs">来院回数</p>
        </div>
      </div>

      <div className="space-y-2">
        {history.map((r) => {
          const s = staff.find((st) => st.id === r.staff_id)
          const m = menus.find((mn) => mn.id === r.menu_id)
          return (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-border">
              <div className="flex-shrink-0 text-center min-w-[52px]">
                <p className="text-xs text-muted-foreground">{format(parseISO(r.start_at), 'M月d日', { locale: ja })}</p>
                <p className="text-xs font-medium">{format(parseISO(r.start_at), 'HH:mm')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {m && <span className="text-sm font-medium text-green-900 truncate">{m.name}</span>}
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  担当: {s?.name ?? '未指定'}
                  {r.memo && <span className="ml-2 text-amber-600">・{r.memo}</span>}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
