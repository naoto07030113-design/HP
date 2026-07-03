'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Reservation, Staff, Menu } from '@/types/clinic'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Calendar, FileText, Plus } from 'lucide-react'
import { medicalRecordStore } from '@/lib/medical-record-store'
import { RecordForm } from '@/features/records/components/RecordForm'
import type { MedicalRecordFormData } from '@/types/medical-record'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  patientId: string
  patientName: string
  reservations: Reservation[]
  staff: Staff[]
  menus: Menu[]
}

export function PatientReservationHistory({ patientId, patientName, reservations, staff, menus }: Props) {
  const [recordFormOpen, setRecordFormOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const history = useMemo(() =>
    reservations
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => (a.start_at > b.start_at ? -1 : 1)),
    [patientId, reservations],
  )

  const existingRecordIds = useMemo(() => {
    const recs = medicalRecordStore.getByPatient(patientId)
    return new Set(recs.map((r) => r.reservation_id).filter(Boolean))
  }, [patientId])

  function openNewRecord(r: Reservation) {
    setSelectedReservation(r)
    setRecordFormOpen(true)
  }

  function handleRecordSubmit(data: MedicalRecordFormData) {
    medicalRecordStore.create(data)
  }

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
          const hasRecord = existingRecordIds.has(r.id)
          const existingRecord = medicalRecordStore.getByReservation(r.id)
          return (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-green-50/60 border border-border">
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
              {/* カルテボタン */}
              {r.status === 'visited' && (
                hasRecord && existingRecord ? (
                  <Link
                    href={`/admin/records/${existingRecord.id}`}
                    className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded transition-colors flex-shrink-0"
                  >
                    <FileText className="w-3 h-3" />
                    カルテ
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openNewRecord(r)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-700 border border-dashed border-border hover:border-green-300 px-2 py-1 rounded transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    カルテ記入
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      <RecordForm
        open={recordFormOpen}
        onOpenChange={setRecordFormOpen}
        defaultPatientId={patientId}
        defaultPatientName={patientName}
        defaultStaffId={selectedReservation?.staff_id ?? undefined}
        defaultClinicId={selectedReservation?.clinic_id}
        defaultDate={selectedReservation ? format(parseISO(selectedReservation.start_at), 'yyyy-MM-dd') : undefined}
        defaultReservationId={selectedReservation?.id}
        onSubmit={handleRecordSubmit}
      />
    </div>
  )
}
