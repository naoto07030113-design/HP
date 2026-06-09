'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Users, ChevronRight } from 'lucide-react'
import { usePatientStore, patientStore } from '@/lib/patient-store'
import { useClinicStore } from '@/lib/clinic-store'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { GENDER_LABELS, INSURANCE_LABELS, calcAge } from '@/types/patient'
import type { Patient, PatientFormData } from '@/types/patient'
import { cn } from '@/lib/utils'

export default function PatientsPage() {
  const patients = usePatientStore()
  const store = useClinicStore()
  const { loading } = store
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Patient | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return patients
      .filter((p) => {
        if (filterClinic !== 'all' && p.clinic_id !== filterClinic) return false
        if (!q) return true
        return (
          p.name.includes(q) ||
          p.name_kana.toLowerCase().includes(q) ||
          (p.phone ?? '').replace(/-/g, '').includes(q.replace(/-/g, ''))
        )
      })
      .sort((a, b) => a.name_kana < b.name_kana ? -1 : 1)
  }, [patients, search, filterClinic])

  // 今月の新患数
  const thisMonth = format(new Date(), 'yyyy-MM')
  const newThisMonth = patients.filter(
    (p) => p.first_visit_date?.startsWith(thisMonth) && (filterClinic === 'all' || p.clinic_id === filterClinic),
  ).length

  function openEdit(p: Patient) { setEditTarget(p); setFormOpen(true) }
  function openAdd() { setEditTarget(null); setFormOpen(true) }

  async function handleSubmit(data: PatientFormData) {
    try {
      if (editTarget) await patientStore.update(editTarget.id, data)
      else await patientStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <TableSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">患者管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">患者台帳・問診情報・来院履歴を管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          患者登録
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-sm text-muted-foreground">総患者数</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {filterClinic === 'all' ? patients.length : patients.filter((p) => p.clinic_id === filterClinic).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-sm text-muted-foreground">今月の新患</p>
          <p className="text-3xl font-bold text-gold-600 mt-1">{newThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 hidden sm:block">
          <p className="text-sm text-muted-foreground">アクティブ</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {patients.filter((p) => p.is_active && (filterClinic === 'all' || p.clinic_id === filterClinic)).length}
          </p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="氏名・フリガナ・電話番号"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterClinic} onValueChange={setFilterClinic}>
          <SelectTrigger className="h-8 w-40 text-sm flex-shrink-0">
            <SelectValue placeholder="院で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての院</SelectItem>
            {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterClinic !== 'all') && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(''); setFilterClinic('all') }}>
            クリア
          </Button>
        )}
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length}件</span>
      </div>

      {/* 患者リスト */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="患者が見つかりません"
          description={search ? `「${search}」に一致する患者はいません` : '患者を登録してください'}
          action={!search ? { label: '患者を登録', onClick: openAdd } : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {/* PC テーブル */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-100 bg-green-50">
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">氏名</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">フリガナ</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">性別・年齢</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">電話番号</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">初診日</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">保険</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">状態</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {filtered.map((p) => {
                  const age = calcAge(p.birth_date)
                  const primaryStaff = store.staff.find((s) => s.id === p.primary_staff_id)
                  return (
                    <tr key={p.id} className="hover:bg-green-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/patients/${p.id}`} className="font-semibold text-green-900 hover:text-green-700 hover:underline">
                          {p.name}
                        </Link>
                        {primaryStaff && (
                          <p className="text-xs text-muted-foreground mt-0.5">担当: {primaryStaff.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.name_kana || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {GENDER_LABELS[p.gender]}
                        {age !== null && <span className="ml-1">{age}歳</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.first_visit_date ? format(new Date(p.first_visit_date), 'yyyy/MM/dd') : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {INSURANCE_LABELS[p.insurance_type]}
                      </td>
                      <td className="px-4 py-3"><ActiveBadge isActive={p.is_active} activeLabel="有効" inactiveLabel="無効" /></td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/patients/${p.id}`}
                          className="text-xs text-green-700 hover:text-green-900 hover:underline">
                          詳細
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* モバイル カードリスト */}
          <div className="md:hidden divide-y divide-green-50">
            {filtered.map((p) => {
              const age = calcAge(p.birth_date)
              return (
                <Link key={p.id} href={`/admin/patients/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-green-50/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-900">{p.name}</span>
                      <ActiveBadge isActive={p.is_active} activeLabel="有効" inactiveLabel="無効" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.name_kana} ・ {GENDER_LABELS[p.gender]}{age !== null ? ` ${age}歳` : ''} ・ {p.phone ?? '電話なし'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <PatientForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} clinics={store.clinics}
        staff={store.staff}
        defaultClinicId={filterClinic !== 'all' ? filterClinic : store.clinics[0]?.id}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
