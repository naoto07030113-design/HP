'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Trash2, Users, ChevronRight } from 'lucide-react'
import { usePatientList, toApiInput } from '@/features/patients/hooks/usePatientList'
import { apiPost, ApiError } from '@/lib/api-client'
import { useClinicStore } from '@/lib/clinic-store'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { GENDER_LABELS, INSURANCE_LABELS, calcAge } from '@/types/patient'
import type { Patient, PatientFormData } from '@/types/patient'
import { cn } from '@/lib/utils'

export default function PatientsPage() {
  const store = useClinicStore()
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('all')

  // 検索・絞り込み・ページングはサーバー側で行う。
  // 全患者をブラウザに載せると件数上限で取りこぼし、他院の情報まで端末に残る。
  const {
    items: filtered, stats, total, page, setPage, hasNext, loading, error, reload, perPage,
  } = usePatientList({ search, clinicId: filterClinic === 'all' ? null : filterClinic })
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Patient | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openEdit(p: Patient) { setEditTarget(p); setFormOpen(true) }
  function openAdd() { setEditTarget(null); setFormOpen(true) }

  async function handleSubmit(data: PatientFormData) {
    try {
      const input = toApiInput(data)
      if (editTarget) await apiPost('/api/v1/patients/update', { id: editTarget.id, ...input }, { authenticated: true })
      else await apiPost('/api/v1/patients/create', input, { authenticated: true })
      toast.success('保存しました')
      reload()
    } catch (err) {
      // 失敗の理由と問い合わせ用の識別子を必ず伝える
      toast.error(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '保存に失敗しました')
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
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-sm text-muted-foreground">今月の新患</p>
          <p className="text-3xl font-bold text-gold-600 mt-1">{stats.newThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 hidden sm:block">
          <p className="text-sm text-muted-foreground">アクティブ</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {stats.active}
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
        <span className="text-xs text-muted-foreground self-center ml-auto">{total}件</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reload}>再試行</Button>
        </div>
      )}

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
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/patients/${p.id}`}
                            className="text-xs text-green-700 hover:text-green-900 hover:underline">
                            詳細
                          </Link>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
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
        key={editTarget?.id ?? 'new'}
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} clinics={store.clinics}
        staff={store.staff}
        defaultClinicId={filterClinic !== 'all' ? filterClinic : store.clinics[0]?.id}
        onSubmit={handleSubmit}
      />

      {/* ページ送り。全件をブラウザに載せないため、ページ単位で取得している */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button variant="outline" size="sm" className="h-8"
            disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            前へ
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}件
          </span>
          <Button variant="outline" size="sm" className="h-8"
            disabled={!hasNext || loading} onClick={() => setPage(page + 1)}>
            次へ
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="患者を削除しますか？"
        description="一覧に表示されなくなります。カルテと予約は記録として残り、必要な場合は管理者が復元できます。"
        confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await apiPost('/api/v1/patients/delete', { id: deleteId }, { authenticated: true })
              reload()
              toast.success('削除しました')
            } catch (err) {
              toast.error(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
