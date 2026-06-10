'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Receipt, Trash2 } from 'lucide-react'
import { useClinicStore, reservationsStore } from '@/lib/clinic-store'
import { ReservationForm } from '@/features/reservations/components/ReservationForm'
import { InvoiceForm } from '@/features/accounting/components/InvoiceForm'
import { accountingStore } from '@/lib/accounting-store'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableSkeleton } from '@/components/common/PageSkeleton'
import { RESERVATION_STATUS_LABELS } from '@/types/clinic'
import type { Reservation } from '@/types/clinic'
import type { InvoiceFormData } from '@/types/accounting'

export default function ReservationsPage() {
  const store = useClinicStore()
  const { loading } = store
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reservation | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceRes, setInvoiceRes] = useState<Reservation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  const filtered = useMemo(() => {
    return store.reservations
      .filter((r) => {
        if (filterClinic !== 'all' && r.clinic_id !== filterClinic) return false
        if (filterStatus !== 'all' && r.status !== filterStatus) return false
        if (filterDate && !r.start_at.startsWith(filterDate)) return false
        if (search) {
          const q = search.toLowerCase()
          return r.patient_name.toLowerCase().includes(q) || (r.patient_phone ?? '').includes(q)
        }
        return true
      })
      .sort((a, b) => a.start_at < b.start_at ? 1 : -1)
  }, [store.reservations, filterClinic, filterStatus, filterDate, search])

  function openEdit(r: Reservation) {
    setEditTarget(r)
    setFormOpen(true)
  }

  function openInvoice(r: Reservation) {
    setInvoiceRes(r)
    setInvoiceOpen(true)
  }

  async function handleSubmit(data: Parameters<typeof reservationsStore.create>[0]) {
    try {
      if (editTarget) await reservationsStore.update(editTarget.id, data)
      else await reservationsStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
    setEditTarget(null)
  }

  async function handleInvoiceSave(data: InvoiceFormData) {
    try {
      await accountingStore.create(data)
      toast.success('会計を作成しました')
    } catch {
      toast.error('会計の作成に失敗しました')
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
            {filtered.length}件表示
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

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="予約を削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await reservationsStore.delete(deleteId)
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
