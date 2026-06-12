'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import type { Invoice, InvoiceFormData, InvoiceItem, PaymentMethod, InsuranceType } from '@/types/accounting'
import {
  PAYMENT_METHOD_LABELS, INSURANCE_TYPE_LABELS,
} from '@/types/accounting'
import { useClinicStore } from '@/lib/clinic-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: Invoice | null
  defaultReservationId?: string | null
  defaultPatientName?: string
  defaultClinicId?: string
  defaultStaffId?: string | null
  defaultMenuId?: string | null
  defaultMenuName?: string
  defaultMenuPrice?: number
  onSave: (data: InvoiceFormData) => void
}

const TAX_RATE = 0.1
const TODAY = format(new Date(), 'yyyy-MM-dd')

function makeItem(overrides?: Partial<InvoiceItem>): InvoiceItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    menu_id: null,
    name: '',
    unit_price: 0,
    quantity: 1,
    discount: 0,
    subtotal: 0,
    ...overrides,
  }
}

function calcItem(item: InvoiceItem): InvoiceItem {
  return { ...item, subtotal: Math.max(0, item.unit_price * item.quantity - item.discount) }
}

export function InvoiceForm({
  open, onOpenChange, editTarget,
  defaultReservationId, defaultPatientName = '', defaultClinicId,
  defaultStaffId, defaultMenuId, defaultMenuName, defaultMenuPrice,
  onSave,
}: Props) {
  const { clinics, staff, menus } = useClinicStore()

  const [patientName, setPatientName] = useState('')
  const [visitDate, setVisitDate] = useState(TODAY)
  const [clinicId, setClinicId] = useState('')
  const [staffId, setStaffId] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([makeItem()])
  const [insuranceType, setInsuranceType] = useState<InsuranceType>('none')
  const [insuranceCopay, setInsuranceCopay] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [memo, setMemo] = useState('')

  // Totals
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const discountTotal = items.reduce((s, i) => s + i.discount, 0)
  const taxable = subtotal - discountTotal
  const taxAmount = Math.round(taxable * TAX_RATE)
  const total = taxable + taxAmount
  const payBase = insuranceType === 'none' ? total : insuranceCopay
  const change = Math.max(0, paymentAmount - payBase)

  // Filtered staff by clinic
  const clinicStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)
  const clinicMenus = menus.filter((m) => m.clinic_id === clinicId && m.is_active)

  // Init from editTarget or defaults
  useEffect(() => {
    if (!open) return
    if (editTarget) {
      setPatientName(editTarget.patient_name)
      setVisitDate(editTarget.visit_date)
      setClinicId(editTarget.clinic_id)
      setStaffId(editTarget.staff_id)
      setReservationId(editTarget.reservation_id)
      setItems(editTarget.items.length > 0 ? editTarget.items : [makeItem()])
      setInsuranceType(editTarget.insurance_type)
      setInsuranceCopay(editTarget.insurance_copay)
      setPaymentMethod(editTarget.payment_method)
      setPaymentAmount(editTarget.payment_amount)
      setMemo(editTarget.memo ?? '')
    } else {
      const firstClinic = clinics[0]?.id ?? ''
      setPatientName(defaultPatientName)
      setVisitDate(TODAY)
      setClinicId(defaultClinicId ?? firstClinic)
      setStaffId(defaultStaffId ?? null)
      setReservationId(defaultReservationId ?? null)
      const initItem = makeItem(
        defaultMenuId
          ? {
              menu_id: defaultMenuId,
              name: defaultMenuName ?? '',
              unit_price: defaultMenuPrice ?? 0,
              quantity: 1,
              discount: 0,
              subtotal: defaultMenuPrice ?? 0,
            }
          : undefined,
      )
      setItems([initItem])
      setInsuranceType('none')
      setInsuranceCopay(0)
      setPaymentMethod('cash')
      setPaymentAmount(0)
      setMemo('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    setItems((prev) =>
      prev.map((item) => item.id === id ? calcItem({ ...item, ...patch }) : item),
    )
  }

  function addItem() {
    setItems((prev) => [...prev, makeItem()])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function selectMenu(itemId: string, menuId: string) {
    const menu = clinicMenus.find((m) => m.id === menuId)
    if (!menu) return
    updateItem(itemId, {
      menu_id: menu.id,
      name: menu.name,
      unit_price: menu.price,
      discount: 0,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      reservation_id: reservationId,
      patient_id: null,
      patient_name: patientName,
      clinic_id: clinicId,
      staff_id: staffId,
      visit_date: visitDate,
      items,
      subtotal,
      discount_total: discountTotal,
      tax_rate: TAX_RATE,
      tax_amount: taxAmount,
      total_amount: total,
      insurance_type: insuranceType,
      insurance_copay: insuranceCopay,
      payment_method: paymentMethod,
      payment_amount: paymentAmount,
      change_amount: change,
      status: paymentAmount >= payBase && payBase > 0 ? 'paid' : (paymentAmount > 0 ? 'paid' : 'unpaid'),
      memo: memo || null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTarget ? '会計を編集' : '新規会計入力'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── 基本情報 ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">基本情報</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>患者名 *</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="患者名を入力"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>来院日 *</Label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>院 *</Label>
                <Select value={clinicId} onValueChange={(v) => { setClinicId(v); setStaffId(null) }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="院を選択" /></SelectTrigger>
                  <SelectContent>
                    {clinics.filter((c) => c.is_active).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>担当</Label>
                <Select
                  value={staffId ?? '__none__'}
                  onValueChange={(v) => setStaffId(v === '__none__' ? null : v)}
                  disabled={!clinicId}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="担当を選択" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">指定なし</SelectItem>
                    {clinicStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ── 明細 ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">明細</h3>

            <div className="space-y-2">
              {/* ヘッダ */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_52px_80px_80px_32px] gap-2 text-xs text-muted-foreground px-1">
                <span>メニュー / 品目名</span>
                <span className="text-right">単価</span>
                <span className="text-center">数量</span>
                <span className="text-right">割引</span>
                <span className="text-right">小計</span>
                <span />
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_52px_80px_80px_32px] gap-2 items-center">
                  {/* 品目: メニュー選択 or 手動入力 */}
                  <div className="space-y-1">
                    {clinicMenus.length > 0 && (
                      <Select
                        value={item.menu_id ?? '__manual__'}
                        onValueChange={(v) => v === '__manual__' ? updateItem(item.id, { menu_id: null }) : selectMenu(item.id, v)}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="メニューから選択..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__manual__">手動入力</SelectItem>
                          {clinicMenus.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name} ¥{m.price.toLocaleString()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {(!item.menu_id || clinicMenus.length === 0) && (
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        placeholder="品目名"
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                  <Input
                    type="number" min={0} value={item.unit_price || ''}
                    onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                    className="h-8 text-xs text-right"
                    placeholder="0"
                  />
                  <Input
                    type="number" min={1} value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                    className="h-8 text-xs text-center"
                  />
                  <Input
                    type="number" min={0} value={item.discount || ''}
                    onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })}
                    className="h-8 text-xs text-right"
                    placeholder="0"
                  />
                  <p className="text-sm text-right font-medium">¥{item.subtotal.toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground disabled:opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
              <Plus className="w-3.5 h-3.5" />
              明細を追加
            </Button>

            {/* 合計欄 */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>小計</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>割引合計</span>
                  <span>-¥{discountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>消費税（10%）</span>
                <span>¥{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>合計</span>
                <span>¥{total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* ── 保険・支払い ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">保険・お支払い</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>保険区分</Label>
                <Select value={insuranceType} onValueChange={(v) => setInsuranceType(v as InsuranceType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INSURANCE_TYPE_LABELS) as [InsuranceType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {insuranceType !== 'none' && (
                <div className="space-y-1">
                  <Label>自己負担額（患者支払額）</Label>
                  <Input
                    type="number" min={0} value={insuranceCopay || ''}
                    onChange={(e) => setInsuranceCopay(Number(e.target.value))}
                    className="h-9"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>支払方法</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>受取金額</Label>
                <Input
                  type="number" min={0} value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="h-9"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 請求・お釣り */}
            <div className="bg-green-50/60 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ご請求額</span>
                <span className="font-medium">
                  ¥{(insuranceType === 'none' ? total : insuranceCopay).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">お預かり</span>
                <span className="font-medium">¥{paymentAmount.toLocaleString()}</span>
              </div>
              {paymentMethod === 'cash' && (
                <div className="flex justify-between text-base font-bold border-t pt-1.5">
                  <span>お釣り</span>
                  <span className={change < 0 ? 'text-red-600' : ''}>
                    ¥{change.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>メモ</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="備考..."
                rows={2}
              />
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" disabled={!patientName || !clinicId}>
              {editTarget ? '更新' : '会計を保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
