'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScanLine, Loader2, RotateCcw, Trash2, BellRing } from 'lucide-react'
import type {
  CashbookEntryFormData, CashbookCategory, CashbookPaymentMethod,
  ScheduledPaymentFormData, ReceiptOcrResult, BankbookOcrRow,
  PaymentDueOcrResult, DocumentOcrResult, DocumentType,
} from '@/types/cashbook'
import {
  EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS, PAYMENT_METHOD_LABELS,
  ENTRY_TYPE_LABELS, DOCUMENT_TYPE_LABELS,
} from '@/types/cashbook'
import { useClinicStore } from '@/lib/clinic-store'
import { fileToResizedDataUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveEntries: (rows: CashbookEntryFormData[]) => Promise<void>
  onSaveScheduledPayment: (data: ScheduledPaymentFormData) => Promise<void>
}

interface BankbookReviewRow extends BankbookOcrRow {
  key: number
  category: CashbookCategory
}

type Step =
  | { mode: 'select' }
  | { mode: 'loading' }
  | { mode: 'receipt'; receipt: ReceiptOcrResult }
  | { mode: 'bankbook'; rows: BankbookReviewRow[] }
  | { mode: 'payment_due'; payment: PaymentDueOcrResult }

export function DocumentUploadDialog({ open, onOpenChange, onSaveEntries, onSaveScheduledPayment }: Props) {
  const { clinics } = useClinicStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>({ mode: 'select' })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<CashbookPaymentMethod>('cash')

  function reset() {
    setStep({ mode: 'select' })
    setSaving(false)
    setPreview(null)
    setClinicId(null)
    setPaymentMethod('cash')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function handleFile(file: File) {
    setStep({ mode: 'loading' })
    try {
      const image = await fileToResizedDataUrl(file, 2000)
      setPreview(image)

      const res = await fetch('/api/cashbook/ocr-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data: DocumentOcrResult & { error?: string } = await res.json()
      if (!res.ok) throw new Error(data.error ?? '読み取りに失敗しました')

      if (data.kind === 'receipt' && data.receipt) {
        setStep({ mode: 'receipt', receipt: data.receipt })
        toast.success('レシート・領収書として読み取りました。内容を確認してください')
      } else if (data.kind === 'bankbook' && data.entries && data.entries.length > 0) {
        setStep({
          mode: 'bankbook',
          rows: data.entries.map((r, i) => ({
            ...r,
            key: i,
            category: r.entry_type === 'income' ? 'sales' : 'misc',
          })),
        })
        toast.success(`通帳として読み取りました（${data.entries.length}件の取引）。内容を確認してください`)
      } else if (data.kind === 'payment_due' && data.payment) {
        setStep({ mode: 'payment_due', payment: data.payment })
        toast.success(`${DOCUMENT_TYPE_LABELS[data.payment.document_type]}として読み取りました。振込期日を確認してください`)
      } else {
        toast.error('書類の種別を判定できませんでした。鮮明な画像で再度お試しください')
        reset()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '読み取りに失敗しました')
      reset()
    }
  }

  // -------------------------------------------------------------------------
  // 保存処理
  // -------------------------------------------------------------------------

  async function saveReceipt(receipt: ReceiptOcrResult) {
    setSaving(true)
    try {
      await onSaveEntries([{
        clinic_id: clinicId,
        entry_date: receipt.entry_date,
        entry_type: 'expense',
        category: receipt.category,
        vendor: receipt.vendor,
        description: receipt.description,
        amount: receipt.amount,
        payment_method: paymentMethod,
        source: 'receipt',
        memo: null,
      }])
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function saveBankbook(rows: BankbookReviewRow[]) {
    const valid = rows.filter((r) => r.amount > 0 && r.description)
    if (valid.length === 0) return
    setSaving(true)
    try {
      await onSaveEntries(valid.map((r) => ({
        clinic_id: clinicId,
        entry_date: r.entry_date,
        entry_type: r.entry_type,
        category: r.category,
        vendor: '',
        description: r.description,
        amount: r.amount,
        payment_method: 'bank_transfer',
        source: 'bankbook',
        memo: null,
      })))
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function savePaymentDue(payment: PaymentDueOcrResult) {
    setSaving(true)
    try {
      await onSaveScheduledPayment({
        clinic_id: clinicId,
        document_type: payment.document_type,
        vendor: payment.vendor,
        description: payment.description,
        amount: payment.amount,
        due_date: payment.due_date,
        status: 'pending',
        memo: null,
      })
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // 共通パーツ
  // -------------------------------------------------------------------------

  const clinicSelect = (
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
  )

  const retryButton = (
    <Button type="button" variant="outline" className="gap-1.5" onClick={reset}>
      <RotateCcw className="w-3.5 h-3.5" />
      別の書類を読み取る
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>書類読み取り</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />

        {/* 1. 画像選択 */}
        {step.mode === 'select' && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl py-12 px-6 flex flex-col items-center gap-3 text-muted-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50/40 transition-colors"
          >
            <ScanLine className="w-8 h-8" />
            <div className="text-sm font-medium">書類を撮影またはアップロード</div>
            <div className="text-xs leading-relaxed text-center">
              レシート・領収書 / 通帳 / 請求書・見積書をAIが自動で判別します<br />
              レシートと通帳は出納帳に、振込期日のある請求書などは支払予定に登録され、期日前日に通知されます
            </div>
          </button>
        )}

        {/* 2. 読み取り中 */}
        {step.mode === 'loading' && (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">書類の種別を判定して読み取っています...</p>
          </div>
        )}

        {/* 3a. レシート確認 */}
        {step.mode === 'receipt' && (
          <div className="space-y-4">
            <div className="text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 font-medium self-start">
              判定結果: レシート・領収書（出納帳に出金として登録）
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="書類" className="rounded-lg border object-cover w-full max-h-48" />
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>支払日</Label>
                    <Input
                      type="date" value={step.receipt.entry_date}
                      onChange={(e) => setStep({ mode: 'receipt', receipt: { ...step.receipt, entry_date: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>金額（税込）</Label>
                    <Input
                      type="number" min={0} value={step.receipt.amount || ''}
                      onChange={(e) => setStep({ mode: 'receipt', receipt: { ...step.receipt, amount: Math.max(0, Number(e.target.value)) } })}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>支払先</Label>
                  <Input
                    value={step.receipt.vendor}
                    onChange={(e) => setStep({ mode: 'receipt', receipt: { ...step.receipt, vendor: e.target.value } })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>摘要</Label>
                  <Input
                    value={step.receipt.description}
                    onChange={(e) => setStep({ mode: 'receipt', receipt: { ...step.receipt, description: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>勘定科目</Label>
                <Select
                  value={step.receipt.category}
                  onValueChange={(v) => setStep({ mode: 'receipt', receipt: { ...step.receipt, category: v as ReceiptOcrResult['category'] } })}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EXPENSE_CATEGORY_LABELS) as [CashbookCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>支払方法</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as CashbookPaymentMethod)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [CashbookPaymentMethod, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {clinicSelect}
            </div>

            <DialogFooter className="gap-2">
              {retryButton}
              <Button
                type="button"
                onClick={() => void saveReceipt(step.receipt)}
                disabled={saving || !step.receipt.description || step.receipt.amount <= 0}
              >
                {saving ? '登録中...' : '出納帳に登録する'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* 3b. 通帳確認 */}
        {step.mode === 'bankbook' && (() => {
          const rows = step.rows
          const updateRow = (key: number, patch: Partial<BankbookReviewRow>) =>
            setStep({ mode: 'bankbook', rows: rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) })
          const removeRow = (key: number) =>
            setStep({ mode: 'bankbook', rows: rows.filter((r) => r.key !== key) })
          const validRows = rows.filter((r) => r.amount > 0 && r.description)
          const incomeTotal = validRows.filter((r) => r.entry_type === 'income').reduce((s, r) => s + r.amount, 0)
          const expenseTotal = validRows.filter((r) => r.entry_type === 'expense').reduce((s, r) => s + r.amount, 0)

          return (
            <div className="space-y-4">
              <div className="text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 font-medium self-start">
                判定結果: 通帳（入出金明細を出納帳に一括登録）
              </div>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="w-44">{clinicSelect}</div>
                <div className="text-xs text-muted-foreground space-x-4">
                  <span>入金合計 <span className="font-semibold text-green-800">{incomeTotal.toLocaleString()}円</span></span>
                  <span>出金合計 <span className="font-semibold text-red-700">{expenseTotal.toLocaleString()}円</span></span>
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-green-50/60">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">日付</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">区分</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">摘要</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">勘定科目</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">金額</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row) => {
                      const categoryOptions = row.entry_type === 'income' ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS
                      return (
                        <tr key={row.key}>
                          <td className="px-3 py-1.5">
                            <Input
                              type="date" value={row.entry_date}
                              onChange={(e) => updateRow(row.key, { entry_date: e.target.value })}
                              className="h-8 text-xs w-32"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Select
                              value={row.entry_type}
                              onValueChange={(v) => updateRow(row.key, {
                                entry_type: v as BankbookReviewRow['entry_type'],
                                category: v === 'income' ? 'sales' : 'misc',
                              })}
                            >
                              <SelectTrigger className={cn(
                                'h-8 text-xs w-20',
                                row.entry_type === 'income' ? 'text-green-800' : 'text-red-700',
                              )}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">{ENTRY_TYPE_LABELS.income}</SelectItem>
                                <SelectItem value="expense">{ENTRY_TYPE_LABELS.expense}</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              value={row.description}
                              onChange={(e) => updateRow(row.key, { description: e.target.value })}
                              className="h-8 text-xs min-w-36"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Select
                              value={row.category}
                              onValueChange={(v) => updateRow(row.key, { category: v as CashbookCategory })}
                            >
                              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.entries(categoryOptions) as [CashbookCategory, string][]).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number" min={0} value={row.amount || ''}
                              onChange={(e) => updateRow(row.key, { amount: Math.max(0, Number(e.target.value)) })}
                              className="h-8 text-xs text-right w-28"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => removeRow(row.key)}
                              className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="gap-2">
                {retryButton}
                <Button
                  type="button"
                  onClick={() => void saveBankbook(rows)}
                  disabled={saving || validRows.length === 0}
                >
                  {saving ? '登録中...' : `${validRows.length}件を出納帳に登録する`}
                </Button>
              </DialogFooter>
            </div>
          )
        })()}

        {/* 3c. 請求書・見積書（支払予定）確認 */}
        {step.mode === 'payment_due' && (
          <div className="space-y-4">
            <div className="text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-medium self-start">
              判定結果: {DOCUMENT_TYPE_LABELS[step.payment.document_type]}（支払予定に登録）
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="書類" className="rounded-lg border object-cover w-full max-h-48" />
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>書類種別</Label>
                    <Select
                      value={step.payment.document_type}
                      onValueChange={(v) => setStep({ mode: 'payment_due', payment: { ...step.payment, document_type: v as DocumentType } })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>金額（税込）</Label>
                    <Input
                      type="number" min={0} value={step.payment.amount || ''}
                      onChange={(e) => setStep({ mode: 'payment_due', payment: { ...step.payment, amount: Math.max(0, Number(e.target.value)) } })}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>支払先（請求元）</Label>
                  <Input
                    value={step.payment.vendor}
                    onChange={(e) => setStep({ mode: 'payment_due', payment: { ...step.payment, vendor: e.target.value } })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>摘要</Label>
                  <Input
                    value={step.payment.description}
                    onChange={(e) => setStep({ mode: 'payment_due', payment: { ...step.payment, description: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>振込期日 *</Label>
                <Input
                  type="date" value={step.payment.due_date}
                  onChange={(e) => setStep({ mode: 'payment_due', payment: { ...step.payment, due_date: e.target.value } })}
                  required
                />
                {!step.payment.due_date && (
                  <p className="text-xs text-amber-700">期日を読み取れませんでした。手動で入力してください</p>
                )}
              </div>
              {clinicSelect}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
              <BellRing className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>振込期日の前日になると、管理画面の上部に通知が表示されます。支払い後に「支払済にする」を押すと出納帳へ自動で記帳されます。</span>
            </div>

            <DialogFooter className="gap-2">
              {retryButton}
              <Button
                type="button"
                onClick={() => void savePaymentDue(step.payment)}
                disabled={saving || !step.payment.due_date || step.payment.amount <= 0}
              >
                {saving ? '登録中...' : '支払予定に登録する'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
