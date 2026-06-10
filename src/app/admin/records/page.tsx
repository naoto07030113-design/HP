'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, FileText, ChevronRight } from 'lucide-react'
import { useMedicalRecordStore, medicalRecordStore } from '@/lib/medical-record-store'
import { useClinicStore } from '@/lib/clinic-store'
import { usePatientStore } from '@/lib/patient-store'
import { RecordForm } from '@/features/records/components/RecordForm'
import { EmptyState } from '@/components/common/EmptyState'
import type { MedicalRecordFormData } from '@/types/medical-record'
import { cn } from '@/lib/utils'

export default function RecordsPage() {
  const records = useMedicalRecordStore()
  const store = useClinicStore()
  const patients = usePatientStore()

  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('all')
  const [filterStaff, setFilterStaff] = useState('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records.filter((r) => {
      if (filterClinic !== 'all' && r.clinic_id !== filterClinic) return false
      if (filterStaff !== 'all' && r.staff_id !== filterStaff) return false
      if (filterFrom && r.visit_date < filterFrom) return false
      if (filterTo && r.visit_date > filterTo) return false
      if (!q) return true
      return (
        r.patient_name.toLowerCase().includes(q) ||
        (r.subjective ?? '').includes(q) ||
        r.treatment_methods.some((m) => m.includes(q))
      )
    })
  }, [records, search, filterClinic, filterStaff, filterFrom, filterTo])

  const thisMonth = format(new Date(), 'yyyy-MM')
  const newThisMonth = records.filter((r) => r.visit_date.startsWith(thisMonth)).length

  const staffOptions = store.staff.filter(
    (s) => filterClinic === 'all' || s.clinic_id === filterClinic,
  )

  async function handleSubmit(data: MedicalRecordFormData) {
    try {
      await medicalRecordStore.create(data)
      toast.success('カルテを保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">カルテ管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">施術記録・SOAPノートを管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          カルテ記入
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-sm text-muted-foreground">総カルテ数</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{records.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-sm text-muted-foreground">今月の記録</p>
          <p className="text-3xl font-bold text-gold-600 mt-1">{newThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 hidden sm:block">
          <p className="text-sm text-muted-foreground">対象患者数</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {new Set(records.map((r) => r.patient_id)).size}
          </p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="患者名・主訴・施術方法"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterClinic} onValueChange={(v) => { setFilterClinic(v); setFilterStaff('all') }}>
          <SelectTrigger className="h-8 w-36 text-sm flex-shrink-0">
            <SelectValue placeholder="院で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての院</SelectItem>
            {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="h-8 w-36 text-sm flex-shrink-0">
            <SelectValue placeholder="担当で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての担当</SelectItem>
            {staffOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
          className="h-8 w-36 text-sm flex-shrink-0"
          title="開始日"
        />
        <Input
          type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
          className="h-8 w-36 text-sm flex-shrink-0"
          title="終了日"
        />
        {(search || filterClinic !== 'all' || filterStaff !== 'all' || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
            setSearch(''); setFilterClinic('all'); setFilterStaff('all')
            setFilterFrom(''); setFilterTo('')
          }}>
            クリア
          </Button>
        )}
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length}件</span>
      </div>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="カルテが見つかりません"
          description={search ? `「${search}」に一致するカルテはありません` : 'カルテを記入してください'}
          action={!search ? { label: 'カルテを記入', onClick: () => setFormOpen(true) } : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {/* PC テーブル */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-100 bg-green-50">
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">施術日</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">患者名</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">担当</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">主訴</th>
                  <th className="text-left px-4 py-3 text-green-900 font-semibold">施術方法</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {filtered.map((r) => {
                  const staff = store.staff.find((s) => s.id === r.staff_id)
                  return (
                    <tr key={r.id} className="hover:bg-green-50/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.visit_date), 'yyyy/MM/dd')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/records/${r.id}`}
                          className="font-semibold text-green-900 hover:text-green-700 hover:underline"
                        >
                          {r.patient_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{staff?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        <span className="line-clamp-1">{r.subjective ?? '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.treatment_methods.slice(0, 3).map((m) => (
                            <span key={m} className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              {m}
                            </span>
                          ))}
                          {r.treatment_methods.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{r.treatment_methods.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/records/${r.id}`} className="text-xs text-green-700 hover:underline">
                          詳細
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* モバイル */}
          <div className="md:hidden divide-y divide-green-50">
            {filtered.map((r) => {
              const staff = store.staff.find((s) => s.id === r.staff_id)
              return (
                <Link
                  key={r.id}
                  href={`/admin/records/${r.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-green-50/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-900">{r.patient_name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.visit_date), 'M/d')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {staff?.name ?? ''}{r.subjective ? ` ・ ${r.subjective}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <RecordForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultClinicId={filterClinic !== 'all' ? filterClinic : store.clinics[0]?.id}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
