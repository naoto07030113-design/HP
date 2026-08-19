'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Receipt, Trash2 } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useReservationList, toApiInput } from '@/features/reservations/hooks/useReservationList'
import { toApiInput as toInvoiceInput } from '@/features/accounting/hooks/useInvoiceList'
import { apiPost, ApiError } from '@/lib/api-client'
import { ReservationForm } from '@/features/reservations/components/ReservationForm'
import { InvoiceForm } from '@/features/accounting/components/InvoiceForm'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { RESERVATION_STATUS_LABELS } from '@/types/clinic'
import type { Reservation } from '@/types/clinic'
import type { InvoiceFormData } from '@/types/accounting'

export default function ReservationsPage() {
  const store = useClinicStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reservation | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceRes, setInvoiceRes] = useState<Reservation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  // 検索・絞り込み・ページングはサーバー側で行う。
  // 全予約をブラウザに載せると他院の予約まで端末に残り、件数上限で取りこぼす。
  const {
    items: filtered, total, page, setPage, hasNext, loading, error, reload, perPage,
  } = useReservationList({
    clinicId: filterClinic === 'all' ? null : filterClinic,
    status: filterStatus === 'all' ? null : (filterStatus as Reservation['status']),
    search,
    from: filterDate || undefined,
    to: filterDate || undefined,
  })

  function openEdit(r: Reservation) {
    setEditTarget(r)
    setFormOpen(true)
  }

  function openInvoice(r: Reservation) {
    setInvoiceRes(r)
    setInvoiceOpen(true)
  }

  async function handleSubmit(data: Partial<Reservation>) {
    try {
      // 枠の重複はサーバーが判定する
      const input = toApiInput(data)
      if (editTarget) await apiPost('/api/v1/reservations/update', { id: editTarget.id, ...input }, { authenticated: true })
      else await apiPost('/api/v1/reservations/create', input, { authenticated: true })
      toast.success('保存しました')
      reload()
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '保存に失敗しました')
    }
    setEditTarget(null)
  }

  async function handleInvoiceSave(data: InvoiceFormData) {
    try {
      await apiPost('/api/v1/invoices/create', toInvoiceInput(data), { authenticated: true })
      toast.success('会計を作成しました')
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '会計の作成に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <TableSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">予約一覧</h1>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" />
          予約追加
        </Button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="患者名・電話番号で検索"
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>
        <Select value={filterClinic} onValueChange={setFilterClinic}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="院" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての院</SelectItem>
            {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {(Object.entries(RESERVATION_STATUS_LABELS) as [Reservation['status'], string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          className="h-8 w-36 text-sm"
        />
        {(search || filterClinic !== 'all' || filterStatus !== 'all' || filterDate) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
            setSearch(''); setFilterClinic('all'); setFilterStatus('all'); setFilterDate('')
          }}>
            クリア
          </Button>
        )}
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50">
                <th className="text-left px-4 py-3 text-green-900 font-semibold">患者名</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">電話番号</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">日時</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">担当</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden lg:table-cell">メニュー</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">状態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {error && (
                <div className="col-span-full bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reload}>再試行</Button>
                </div>
              )}
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">予約が見つかりません</td></tr>
              ) : filtered.map((r) => {
                const staff = store.staff.find((s) => s.id === r.staff_id)
                const menu = store.menus.find((m) => m.id === r.menu_id)
                return (
                  <tr key={r.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-green-900">{r.patient_name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.patient_phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{format(parseISO(r.start_at), 'M月d日')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(r.start_at), 'HH:mm')} - {format(parseISO(r.end_at), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{staff?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{menu?.name ?? '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === 'visited' && (
                          <Button
                            variant="outline" size="sm"
                            className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => openInvoice(r)}
                          >
                            <Receipt className="w-3 h-3" />
                            会計
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(r)}>
                          編集
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(r.id)}
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
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-green-50 text-xs text-muted-foreground bg-green-50/30">
            {total}件
          </div>
        )}
      </div>

      <ReservationForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} clinics={store.clinics}
        staff={store.staff} menus={store.menus}
        defaultClinicId={store.clinics[0]?.id}
        onSubmit={handleSubmit}
      />

      {/* ページ送り。全件をブラウザに載せないため、ページ単位で取得している */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button variant="outline" size="sm" className="h-8"
            disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>前へ</Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}件
          </span>
          <Button variant="outline" size="sm" className="h-8"
            disabled={!hasNext || loading} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="予約を削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await apiPost('/api/v1/reservations/delete', { id: deleteId }, { authenticated: true })
              reload()
              toast.success('削除しました')
            } catch {
              toast.error('削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />

      {invoiceRes && (
        <InvoiceForm
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          defaultReservationId={invoiceRes.id}
          defaultPatientName={invoiceRes.patient_name}
          defaultClinicId={invoiceRes.clinic_id}
          defaultStaffId={invoiceRes.staff_id}
          defaultMenuId={invoiceRes.menu_id}
          defaultMenuName={store.menus.find((m) => m.id === invoiceRes.menu_id)?.name}
          defaultMenuPrice={store.menus.find((m) => m.id === invoiceRes.menu_id)?.price}
          onSave={handleInvoiceSave}
        />
      )}
    </div>
  )
}
