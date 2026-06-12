'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Camera, Loader2, RotateCcw } from 'lucide-react'
import type {
  CashbookEntryFormData, CashbookCategory, CashbookPaymentMethod, ReceiptOcrResult,
} from '@/types/cashbook'
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/types/cashbook'
import { useClinicStore } from '@/lib/clinic-store'
import { fileToResizedDataUrl } from '@/lib/image-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CashbookEntryFormData) => Promise<void>
}

export function ReceiptUploadDialog({ open, onOpenChange, onSave }: Props) {
  const { clinics } = useClinicStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ReceiptOcrResult | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<CashbookPaymentMethod>('cash')

  function reset() {
    setPreview(null)
    setResult(null)
    setLoading(false)
    setSaving(false)
    setClinicId(null)
    setPaymentMethod('cash')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function handleFile(file: File) {
    setLoading(true)
    try {
      const image = await fileToResizedDataUrl(file)
      setPreview(image)

      const res = await fetch('/api/cashbook/ocr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '読み取りに失敗しました')

      setResult(data as ReceiptOcrResult)
      toast.success('レシートを読み取りました。内容を確認してください')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '読み取りに失敗しました')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    try {
      await onSave({
        clinic_id: clinicId,
        entry_date: result.entry_date,
        entry_type: 'expense',
        category: result.category,
        vendor: result.vendor,
        description: result.description,
        amount: result.amount,
        payment_method: paymentMethod,
        source: 'receipt',
        memo: null,
      })
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>レシート読み取り</DialogTitle>
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
        {!preview && !loading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl py-12 flex flex-col items-center gap-3 text-muted-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50/40 transition-colors"
          >
            <Camera className="w-8 h-8" />
            <div className="text-sm font-medium">レシートを撮影またはアップロード</div>
            <div className="text-xs">日付・金額・支払先を自動で読み取り、該当月の出納帳に反映します</div>
          </button>
        )}

        {/* 2. 読み取り中 */}
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">レシートを読み取っています...</p>
          </div>
        )}

        {/* 3. 確認・修正 */}
        {result && preview && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="レシート" className="rounded-lg border object-cover w-full max-h-48" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>支払日</Label>
                    <Input
                      type="date" value={result.entry_date}
                      onChange={(e) => setResult({ ...result, entry_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>金額（税込）</Label>
                    <Input
                      type="number" min={0} value={result.amount || ''}
                      onChange={(e) => setResult({ ...result, amount: Math.max(0, Number(e.target.value)) })}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>支払先</Label>
                  <Input
                    value={result.vendor}
                    onChange={(e) => setResult({ ...result, vendor: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>摘要</Label>
                  <Input
                    value={result.description}
                    onChange={(e) => setResult({ ...result, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>勘定科目</Label>
                <Select
                  value={result.category}
                  onValueChange={(v) => setResult({ ...result, category: v as ReceiptOcrResult['category'] })}
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

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="gap-1.5" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5" />
                別の画像を読み取る
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !result.description || result.amount <= 0}
              >
                {saving ? '登録中...' : '出納帳に登録する'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
