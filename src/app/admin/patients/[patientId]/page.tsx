'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Calendar,
  User, Shield, AlertTriangle, FileText, Clock,
} from 'lucide-react'
import { usePatientStore, patientStore } from '@/lib/patient-store'
import { useClinicStore } from '@/lib/clinic-store'
import { useAccountingStore } from '@/lib/accounting-store'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { PatientReservationHistory } from '@/features/patients/components/PatientReservationHistory'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { GENDER_LABELS, INSURANCE_LABELS, calcAge } from '@/types/patient'
import type { PatientFormData } from '@/types/patient'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/types/accounting'
import { cn } from '@/lib/utils'

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-green-50 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-green-900 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = String(params.patientId)
  const router = useRouter()

  const patients = usePatientStore()
  const store = useClinicStore()
  const invoices = useAccountingStore()

  const patient = patients.find((p) => p.id === patientId)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">患者が見つかりません</p>
        <Link href="/admin/patients">
          <Button variant="outline" size="sm">患者一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const clinic = store.clinics.find((c) => c.id === patient.clinic_id)
  const primaryStaff = store.staff.find((s) => s.id === patient.primary_staff_id)
  const age = calcAge(patient.birth_date)

  // この患者の予約（patient_idで紐付け）
  const patientReservations = store.reservations.filter((r) => r.patient_id === patient.id)
  const visitedCount = patientReservations.filter((r) => r.status === 'visited').length
  const lastVisit = patientReservations
    .filter((r) => r.status === 'visited')
    .sort((a, b) => (a.start_at > b.start_at ? -1 : 1))[0]

  // この患者の会計履歴（患者名で検索）
  const patientInvoices = invoices
    .filter((inv) => inv.patient_name === patient.name)
    .sort((a, b) => (a.visit_date > b.visit_date ? -1 : 1))
  const totalPaid = patientInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  function handleSubmit(data: PatientFormData) {
    if (!patient) return
    patientStore.update(patient.id, data)
  }

  function handleDelete() {
    if (!patient) return
    patientStore.delete(patient.id)
    router.push('/admin/patients')
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link href="/admin/patients">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-green-900">{patient.name}</h1>
            {patient.name_kana && (
              <span className="text-sm text-muted-foreground">{patient.name_kana}</span>
            )}
            <ActiveBadge isActive={patient.is_active} activeLabel="有効" inactiveLabel="無効" />
          </div>
          <p className="text-sm text-muted-foreground">
            {GENDER_LABELS[patient.gender]}{age !== null ? ` ${age}歳` : ''}
            {patient.birth_date && ` （${format(new Date(patient.birth_date), 'yyyy年M月d日')}生）`}
            {clinic && ` ・ ${clinic.name}`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Pencil className="w-3.5 h-3.5" />
          編集
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
          <p className="text-2xl font-bold text-green-900">{patientReservations.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">総予約数</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
          <p className="text-2xl font-bold text-gold-700">{visitedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">来院回数</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-3 text-center">
          <p className="text-sm font-bold text-green-900">
            {lastVisit ? format(new Date(lastVisit.start_at), 'M/d') : '-'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">最終来院</p>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="info">基本情報</TabsTrigger>
          <TabsTrigger value="medical">医療情報</TabsTrigger>
          <TabsTrigger value="history">来院履歴 ({patientReservations.length})</TabsTrigger>
          <TabsTrigger value="accounting">会計履歴 ({patientInvoices.length})</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="info">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">連絡先</h3>
              <InfoRow label="電話番号" value={patient.phone} icon={Phone} />
              <InfoRow label="メールアドレス" value={patient.email} icon={Mail} />
              <InfoRow label="住所" value={[patient.postal_code, patient.address].filter(Boolean).join(' ')} icon={MapPin} />
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">来院情報</h3>
              <InfoRow label="初診日" value={patient.first_visit_date ? format(new Date(patient.first_visit_date), 'yyyy年M月d日') : null} icon={Calendar} />
              <InfoRow label="担当スタッフ" value={primaryStaff?.name} icon={User} />
              <InfoRow label="保険種別" value={INSURANCE_LABELS[patient.insurance_type]} icon={Shield} />
              <InfoRow label="紹介元" value={patient.referral_source} />
            </div>
          </div>
        </TabsContent>

        {/* 医療情報タブ */}
        <TabsContent value="medical">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  問診票
                </h3>
                <div className="space-y-3 text-sm">
                  {patient.chief_complaint && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">主訴</p>
                      <p className="text-green-900 bg-green-50 rounded-lg p-2.5 leading-relaxed">{patient.chief_complaint}</p>
                    </div>
                  )}
                  {patient.medical_history && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">既往歴</p>
                      <p className="text-green-900">{patient.medical_history}</p>
                    </div>
                  )}
                  {patient.current_medications && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">服薬中の薬</p>
                      <p className="text-green-900">{patient.current_medications}</p>
                    </div>
                  )}
                  {patient.allergies && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        アレルギー
                      </p>
                      <p className="text-amber-800 bg-amber-50 rounded-lg p-2.5 font-medium">{patient.allergies}</p>
                    </div>
                  )}
                  {!patient.chief_complaint && !patient.medical_history && !patient.current_medications && !patient.allergies && (
                    <p className="text-muted-foreground text-center py-4">問診情報が未入力です</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">院内メモ（スタッフ専用）</h3>
              {patient.notes ? (
                <p className="text-sm text-green-900 bg-amber-50 rounded-lg p-3 leading-relaxed border border-amber-100">
                  {patient.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">メモなし</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 来院履歴タブ */}
        <TabsContent value="history">
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <PatientReservationHistory
              patientId={patient.id}
              patientName={patient.name}
              reservations={store.reservations}
              staff={store.staff}
              menus={store.menus}
            />
          </div>
        </TabsContent>

        {/* 会計履歴タブ */}
        <TabsContent value="accounting">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {patientInvoices.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">会計履歴がありません</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-100 bg-green-50">
                        <th className="text-left px-4 py-3 text-green-900 font-semibold">伝票番号</th>
                        <th className="text-left px-4 py-3 text-green-900 font-semibold">来院日</th>
                        <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">担当</th>
                        <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">支払方法</th>
                        <th className="text-right px-4 py-3 text-green-900 font-semibold">合計</th>
                        <th className="text-left px-4 py-3 text-green-900 font-semibold">状態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {patientInvoices.map((inv) => {
                        const invStaff = store.staff.find((s) => s.id === inv.staff_id)
                        return (
                          <tr key={inv.id} className="hover:bg-green-50/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.invoice_number}</td>
                            <td className="px-4 py-3 font-medium text-green-900">{format(new Date(inv.visit_date), 'yyyy年M月d日')}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{invStaff?.name ?? '-'}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{PAYMENT_METHOD_LABELS[inv.payment_method]}</td>
                            <td className="px-4 py-3 text-right font-medium text-green-900">¥{inv.total_amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', INVOICE_STATUS_COLORS[inv.status])}>
                                {INVOICE_STATUS_LABELS[inv.status]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 border-t border-green-50 bg-green-50/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{patientInvoices.length}件</span>
                  <span className="font-semibold text-green-900">支払済合計: ¥{totalPaid.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 危険ゾーン */}
      <div className="border border-red-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-700 mb-2">危険な操作</p>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          この患者を削除
        </Button>
      </div>

      <PatientForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={patient} clinics={store.clinics}
        staff={store.staff}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleteOpen} onOpenChange={setDeleteOpen}
        title="患者を削除しますか？"
        description={`「${patient.name}」のすべてのデータが削除されます。この操作は元に戻せません。`}
        confirmLabel="削除する" variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
