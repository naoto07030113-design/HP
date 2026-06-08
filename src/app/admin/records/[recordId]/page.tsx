'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Trash2, User, Stethoscope, Activity, FileText, CalendarDays } from 'lucide-react'
import { medicalRecordStore } from '@/lib/medical-record-store'
import { useClinicStore } from '@/lib/clinic-store'
import { usePatientStore } from '@/lib/patient-store'
import { RecordForm } from '@/features/records/components/RecordForm'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { MedicalRecordFormData } from '@/types/medical-record'
import { cn } from '@/lib/utils'

function Section({ title, icon: Icon, children }: {
  title: string; icon?: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="py-2 border-b border-green-50 last:border-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-green-900 mt-0.5 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

export default function RecordDetailPage() {
  const params = useParams()
  const recordId = String(params.recordId)
  const router = useRouter()
  const store = useClinicStore()
  const patients = usePatientStore()

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Use local state-driven re-read since store doesn't have a per-record hook
  const record = medicalRecordStore.getById(recordId)

  if (!record) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">カルテが見つかりません</p>
        <Link href="/admin/records">
          <Button variant="outline" size="sm">カルテ一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const staff = store.staff.find((s) => s.id === record.staff_id)
  const clinic = store.clinics.find((c) => c.id === record.clinic_id)
  const patient = patients.find((p) => p.id === record.patient_id)

  function handleSubmit(data: MedicalRecordFormData) {
    if (!record) return
    medicalRecordStore.update(record.id, data)
    router.refresh()
  }

  function handleDelete() {
    if (!record) return
    medicalRecordStore.delete(record.id)
    router.push('/admin/records')
  }

  const bp = record.blood_pressure_systolic && record.blood_pressure_diastolic
    ? `${record.blood_pressure_systolic} / ${record.blood_pressure_diastolic} mmHg`
    : null

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link href="/admin/records">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-green-900">{record.patient_name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(record.visit_date), 'yyyy年M月d日')}
            {staff && ` ・ 担当: ${staff.name}`}
            {clinic && ` ・ ${clinic.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patient && (
            <Link href={`/admin/patients/${patient.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="w-3.5 h-3.5" />
                患者情報
              </Button>
            </Link>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Pencil className="w-3.5 h-3.5" />
            編集
          </Button>
        </div>
      </div>

      {/* バイタル・施術サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bp && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground">血圧</p>
            <p className="text-sm font-bold text-green-900 mt-1">{bp}</p>
          </div>
        )}
        {record.pulse && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground">脈拍</p>
            <p className="text-lg font-bold text-green-900 mt-1">{record.pulse} <span className="text-xs font-normal">bpm</span></p>
          </div>
        )}
        {record.temperature && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground">体温</p>
            <p className="text-lg font-bold text-green-900 mt-1">{record.temperature} <span className="text-xs font-normal">°C</span></p>
          </div>
        )}
        {record.treatment_duration_min && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground">施術時間</p>
            <p className="text-lg font-bold text-green-900 mt-1">{record.treatment_duration_min} <span className="text-xs font-normal">分</span></p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* SOAP */}
        <div className="space-y-3 sm:col-span-2">
          <Section title="SOAP" icon={FileText}>
            <div className="grid sm:grid-cols-2 gap-x-6">
              <Field label="S — 主訴・患者の訴え" value={record.subjective} />
              <Field label="O — 所見・検査結果" value={record.objective} />
              <Field label="A — 評価・診断" value={record.assessment} />
              <Field label="P — 治療計画" value={record.plan} />
            </div>
          </Section>
        </div>

        {/* 施術情報 */}
        <Section title="施術情報" icon={Stethoscope}>
          {record.treatment_areas.length > 0 && (
            <div className="py-2 border-b border-green-50">
              <p className="text-xs text-muted-foreground mb-1.5">施術部位</p>
              <div className="flex flex-wrap gap-1.5">
                {record.treatment_areas.map((a) => (
                  <span key={a} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}
          {record.treatment_methods.length > 0 && (
            <div className="py-2 border-b border-green-50">
              <p className="text-xs text-muted-foreground mb-1.5">施術方法</p>
              <div className="flex flex-wrap gap-1.5">
                {record.treatment_methods.map((m) => (
                  <span key={m} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )}
          <Field label="施術メモ" value={record.treatment_notes} />
        </Section>

        {/* 次回・メモ */}
        <Section title="次回・メモ" icon={CalendarDays}>
          <Field label="次回来院計画" value={record.next_visit_plan} />
          <Field label="院内メモ" value={record.memo} />
          {!record.next_visit_plan && !record.memo && (
            <p className="text-sm text-muted-foreground py-2">記録なし</p>
          )}
        </Section>
      </div>

      {/* 危険ゾーン */}
      <div className="border border-red-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-700 mb-2">危険な操作</p>
        <Button
          variant="outline" size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          このカルテを削除
        </Button>
      </div>

      <RecordForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={record}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleteOpen} onOpenChange={setDeleteOpen}
        title="カルテを削除しますか？"
        description={`${record.patient_name}（${record.visit_date}）のカルテを削除します。この操作は元に戻せません。`}
        confirmLabel="削除する" variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
