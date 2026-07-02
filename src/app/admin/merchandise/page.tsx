'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Plus, Pencil, Trash2, ShoppingBag, Package, ChevronDown, ChevronUp,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { useMerchandiseStore, merchandiseStore, merchandiseBookingsStore } from '@/lib/merchandise-store'
import { useClinicStore } from '@/lib/clinic-store'
import { useClinicFilter } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import type { Merchandise, MerchandiseBooking, MerchandiseFormData } from '@/types/merchandise'
import {
  MERCHANDISE_BOOKING_STATUS_LABELS,
  MERCHANDISE_BOOKING_STATUS_COLORS,
} from '@/types/merchandise'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type Tab = 'products' | 'bookings'

const EMPTY_FORM: MerchandiseFormData = {
  clinic_id: '',
  name: '',
  description: null,
  price: 0,
  stock: null,
  image_url: null,
  is_active: true,
  sort_order: 0,
}

export default function MerchandisePage() {
  const store = useMerchandiseStore()
  const { clinics } = useClinicStore()
  const clinicFilter = useClinicFilter()
  const activeClinics = clinics.filter((c) => c.is_active && (!clinicFilter || c.id === clinicFilter))

  const [tab, setTab] = useState<Tab>('products')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Merchandise | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [clinicId, setClinicId] = useState<string>(clinicFilter ?? '__all__')
  const [form, setForm] = useState<MerchandiseFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const displayedMerchandise = clinicId === '__all__'
    ? store.merchandise
    : store.merchandise.filter((m) => m.clinic_id === clinicId)

  const displayedBookings = clinicId === '__all__'
    ? store.bookings
    : store.bookings.filter((b) => b.clinic_id === clinicId)

  function openAdd() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, clinic_id: clinicId === '__all__' ? (activeClinics[0]?.id ?? '') : clinicId })
    setFormOpen(true)
  }

  function openEdit(m: Merchandise) {
    setEditTarget(m)
    setForm({
      clinic_id: m.clinic_id,
      name: m.name,
      description: m.description,
      price: m.price,
      stock: m.stock,
      image_url: m.image_url,
      is_active: m.is_active,
      sort_order: m.sort_order,
    })
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.clinic_id) { toast.error('院と商品名を入力してください'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await merchandiseStore.update(editTarget.id, form)
      } else {
        await merchandiseStore.create(form)
      }
      toast.success('保存しました')
      setFormOpen(false)
    } catch (err) {
      const msg = (err as { message?: string })?.message
      toast.error(msg ? `保存に失敗しました: ${msg}` : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(m: Merchandise) {
    try {
      await merchandiseStore.update(m.id, { is_active: !m.is_active })
      toast.success(m.is_active ? '非公開にしました' : '公開しました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  async function handleStatusChange(booking: MerchandiseBooking, status: MerchandiseBooking['status']) {
    try {
      await merchandiseBookingsStore.updateStatus(booking.id, status)
      toast.success('ステータスを更新しました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">物販管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">物販商品の登録と予約状況を管理します</p>
        </div>
        {tab === 'products' && (
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            商品を追加
          </Button>
        )}
      </div>

      {/* 院フィルタ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {!clinicFilter && (
            <button
              onClick={() => setClinicId('__all__')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                clinicId === '__all__'
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-muted-foreground border-border hover:border-green-300',
              )}
            >
              全院
            </button>
          )}
          {activeClinics.map((c) => (
            <button
              key={c.id}
              onClick={() => setClinicId(c.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                clinicId === c.id
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-muted-foreground border-border hover:border-green-300',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* タブ */}
        <div className="ml-auto flex gap-1 bg-green-50/60 rounded-lg p-1">
          {([['products', '商品一覧'], ['bookings', '予約状況']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                tab === t ? 'bg-white shadow-sm text-green-900' : 'text-muted-foreground hover:text-green-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 商品一覧タブ */}
      {tab === 'products' && (
        displayedMerchandise.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="商品が登録されていません"
            action={{ label: '商品を追加', onClick: openAdd }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {displayedMerchandise.map((m) => {
              const clinic = clinics.find((c) => c.id === m.clinic_id)
              const bookingCount = store.bookings.filter((b) => b.merchandise_id === m.id && b.status !== 'cancelled').length
              return (
                <div key={m.id} className={cn('bg-white rounded-xl border shadow-sm p-4 transition-shadow hover:shadow-md', m.is_active ? 'border-green-100' : 'border-gray-200 opacity-70')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 ring-1 ring-pink-200/60 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 text-sm leading-tight">{m.name}</p>
                        {clinic && <p className="text-[11px] text-muted-foreground mt-0.5">{clinic.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {m.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-green-900">¥{m.price.toLocaleString()}</span>
                      {m.stock !== null && (
                        <span className="text-xs text-muted-foreground ml-2">在庫: {m.stock}個</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {bookingCount > 0 && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5">
                          予約 {bookingCount}件
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleActive(m)}
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1 border transition-all',
                          m.is_active
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200',
                        )}
                      >
                        {m.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {m.is_active ? '公開中' : '非公開'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* 予約状況タブ */}
      {tab === 'bookings' && (
        displayedBookings.length === 0 ? (
          <EmptyState icon={Package} title="予約がありません" />
        ) : (
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50/60 border-b border-green-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">日時</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">商品</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">患者名</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">電話番号</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">数量</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-green-800">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {displayedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(booking.booked_at), 'M/d HH:mm', { locale: ja })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-green-900">{booking.merchandise?.name ?? '—'}</p>
                        {booking.notes && <p className="text-xs text-muted-foreground mt-0.5">{booking.notes}</p>}
                      </td>
                      <td className="px-4 py-3 font-medium">{booking.patient_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{booking.patient_phone ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold">{booking.quantity}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={booking.status}
                          onValueChange={(v) => handleStatusChange(booking, v as MerchandiseBooking['status'])}
                        >
                          <SelectTrigger className={cn('h-7 text-xs w-[100px] border', MERCHANDISE_BOOKING_STATUS_COLORS[booking.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(MERCHANDISE_BOOKING_STATUS_LABELS) as [MerchandiseBooking['status'], string][]).map(([val, lbl]) => (
                              <SelectItem key={val} value={val}>{lbl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* 商品フォーム */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? '商品を編集' : '商品を追加'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>院</Label>
              <Select value={form.clinic_id} onValueChange={(v) => setForm((f) => ({ ...f, clinic_id: v }))}>
                <SelectTrigger><SelectValue placeholder="院を選択" /></SelectTrigger>
                <SelectContent>
                  {activeClinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>商品名</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例: テーピングテープ"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>説明（任意）</Label>
              <Textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                placeholder="商品の詳細説明"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>価格（円）</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>在庫数（空欄=無制限）</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value === '' ? null : Number(e.target.value) }))}
                  placeholder="無制限"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>並び順</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
              <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="商品を削除しますか？"
        description="関連する予約データも削除されます"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await merchandiseStore.delete(deleteId)
              toast.success('削除しました')
            } catch {
              toast.error('削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
