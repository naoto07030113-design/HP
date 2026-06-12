'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type {
  CashbookEntry, CashbookEntryFormData, CashbookCategory,
  CashbookPaymentMethod, EntryType,
} from '@/types/cashbook'
import {
  EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS, PAYMENT_METHOD_LABELS,
} from '@/types/cashbook'
import { useClinicStore } from '@/lib/clinic-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: CashbookEntry | null
  onSave: (data: CashbookEntryFormData) => void
}

const TODAY = format(new Date(), 'yyyy-MM-dd')

export function EntryForm({ open, onOpenChange, editTarget, onSave }: Props) {
  const { clinics } = useClinicStore()

  const [entryDate, setEntryDate] = useState(TODAY)
  const [entryType, setEntryType] = useState<EntryType>('expense')
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [category, setCategory] = useState<CashbookCategory>('supplies')
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<CashbookPaymentMethod>('cash')
  const [memo, setMemo] = useState('')

  // Init from editTarget or defaults
  useEffect(() => {
    if (!open) return
    if (editTarget) {
      setEntryDate(editTarget.entry_date)
      setEntryType(editTarget.entry_type)
      setClinicId(editTarget.clinic_id)
      setCategory(editTarget.category)
      setVendor(editTarget.vendor)
      setDescription(editTarget.description)
      setAmount(editTarget.amount)
      setPaymentMethod(editTarget.payment_method)
      setMemo(editTarget.memo ?? '')
    } else {
      setEntryDate(TODAY)
      setEntryType('expense')
      setClinicId(null)
      setCategory('supplies')
      setVendor('')
      setDescription('')
      setAmount(0)
      setPaymentMethod('cash')
      setMemo('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeEntryType(type: EntryType) {
    setEntryType(type)
    setCategory(type === 'income' ? 'sales' : 'supplies')
  }

  const categoryOptions = entryType === 'income' ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      clinic_id: clinicId,
      entry_date: entryDate,
      entry_type: entryType,
      category,
      vendor,
      description,
      amount,
      payment_method: paymentMethod,
      source: editTarget?.source ?? 'manual',
      memo: memo || null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTarget ? '入出金を編集' : '新規入出金の登録'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 区分切替 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => changeEntryType('expense')}
              className={
                entryType === 'expense'
                  ? 'h-10 rounded-lg border-2 border-red-400 bg-red-50 text-red-700 font-semibold text-sm'
                  : 'h-10 rounded-lg border text-muted-foreground text-sm hover:bg-gray-50'
              }
            >
              出金（経費）
            </button>
            <button
              type="button"
              onClick={() => changeEntryType('income')}
              className={
                entryType === 'income'
                  ? 'h-10 rounded-lg border-2 border-green-500 bg-green-50 text-green-800 font-semibold text-sm'
                  : 'h-10 rounded-lg border text-muted-foreground text-sm hover:bg-gray-50'
              }
            >
              入金（収入）
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>日付 *</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>院</Label>
              <Select
                value={clinicId ?? '__common__'}
                onValueChange={(v) => setClinicId(v === '__common__' ? null : v)}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__common__">全社共通</SelectItem>
                  {clinics.filter((c) => c.is_active).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>勘定科目 *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CashbookCategory)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(categoryOptions) as [CashbookCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>金額（税込） *</Label>
              <Input
                type="number" min={0} value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="h-9 text-right"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{entryType === 'income' ? '入金元' : '支払先'}</Label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder={entryType === 'income' ? '例：保険請求、患者窓口' : '例：〇〇商事、△△電力'}
            />
          </div>

          <div className="space-y-1">
            <Label>摘要 *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={entryType === 'income' ? '例：4月分 保険診療報酬' : '例：診察用グローブ 10箱'}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>{entryType === 'income' ? '入金方法' : '支払方法'}</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as CashbookPaymentMethod)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(PAYMENT_METHOD_LABELS) as [CashbookPaymentMethod, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" disabled={!description || amount <= 0}>
              {editTarget ? '更新' : '登録する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
