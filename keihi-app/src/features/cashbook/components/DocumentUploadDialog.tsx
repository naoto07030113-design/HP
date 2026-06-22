'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScanLine, Loader2, RotateCcw, Trash2, BellRing, Link2 } from 'lucide-react'
import type {
  CashbookEntryFormData, CashbookCategory, CashbookPaymentMethod, EntryType,
  EntrySource, ScheduledPaymentFormData, DocumentOcrResult, DocumentType,
} from '@/types/cashbook'
import {
  EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS, ENTRY_TYPE_LABELS,
  ENTRY_SOURCE_LABELS, DOCUMENT_TYPE_LABELS,
} from '@/types/cashbook'
import { useBusinessStore } from '@/lib/business-store'
import { useCardStore, cardStore } from '@/lib/card-store'
import { fileToResizedDataUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveEntries: (rows: CashbookEntryFormData[]) => Promise<void>
  onSaveScheduledPayment: (data: ScheduledPaymentFormData) => Promise<void>
}

// 出納帳に登録する下書き（レシート / カード明細 / 通帳の各行）
interface Draft {
  key: number
  source: Extract<EntrySource, 'receipt' | 'card_statement' | 'bankbook'>
  entry_date: string
  entry_type: EntryType
  category: CashbookCategory
  vendor: string
  description: string
  amount: number
  card_last4: string
  business_id: string | null
  payment_method: CashbookPaymentMethod
}

// 支払予定に登録する下書き（請求書・見積書）
interface PayDraft {
  key: number
  document_type: DocumentType
  vendor: string
  description: string
  amount: number
  due_date: string
  business_id: string | null
}

type Phase = 'select' | 'loading' | 'review'

const SOURCE_BADGE: Record<Draft['source'], string> = {
  receipt:        'bg-green-100 text-green-800',
  card_statement: 'bg-indigo-100 text-indigo-800',
  bankbook:       'bg-sky-100 text-sky-800',
}

export function DocumentUploadDialog({ open, onOpenChange, onSaveEntries, onSaveScheduledPayment }: Props) {
  const { businesses } = useBusinessStore()
  useCardStore() // 下4桁→事業所の対応を購読
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('select')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [pays, setPays] = useState<PayDraft[]>([])
  const [saving, setSaving] = useState(false)

  function reset() {
    setPhase('select')
    setProgress({ done: 0, total: 0 })
    setDrafts([])
    setPays([])
    setSaving(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function handleFiles(files: File[]) {
    setPhase('loading')
    setProgress({ done: 0, total: files.length })

    const newDrafts: Draft[] = []
    const newPays: PayDraft[] = []
    let k = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const image = await fileToResizedDataUrl(file, 2000)
        const res = await fetch('/api/cashbook/ocr-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        })
        const data: DocumentOcrResult & { error?: string } = await res.json()
        if (!res.ok) throw new Error(data.error ?? '読み取りに失敗しました')

        if (data.kind === 'receipt' && data.receipt) {
          const r = data.receipt
          newDrafts.push({
            key: k++, source: 'receipt', entry_date: r.entry_date, entry_type: 'expense',
            category: r.category, vendor: r.vendor, description: r.description, amount: r.amount,
            card_last4: r.card_last4, business_id: cardStore.businessForLast4(r.card_last4),
            payment_method: r.card_last4 ? 'card' : 'cash',
          })
        } else if (data.kind === 'card_statement' && data.statement) {
          for (const s of data.statement) {
            newDrafts.push({
              key: k++, source: 'card_statement', entry_date: s.entry_date, entry_type: 'expense',
              category: s.category, vendor: '', description: s.description, amount: s.amount,
              card_last4: s.card_last4, business_id: cardStore.businessForLast4(s.card_last4),
              payment_method: 'card',
            })
          }
        } else if (data.kind === 'bankbook' && data.entries) {
          for (const e of data.entries) {
            newDrafts.push({
              key: k++, source: 'bankbook', entry_date: e.entry_date, entry_type: e.entry_type,
              category: e.entry_type === 'income' ? 'sales' : 'misc', vendor: '',
              description: e.description, amount: e.amount, card_last4: '', business_id: null,
              payment_method: 'bank_transfer',
            })
          }
        } else if (data.kind === 'payment_due' && data.payment) {
          const p = data.payment
          newPays.push({
            key: k++, document_type: p.document_type, vendor: p.vendor, description: p.description,
            amount: p.amount, due_date: p.due_date, business_id: null,
          })
        } else {
          toast.error(`${file.name || `${i + 1}枚目`}: 書類の種別を判定できませんでした`)
        }
      } catch (err) {
        toast.error(`${file.name || `${i + 1}枚目`}: ${err instanceof Error ? err.message : '読み取りに失敗しました'}`)
      }
      setProgress({ done: i + 1, total: files.length })
    }

    if (newDrafts.length === 0 && newPays.length === 0) {
      reset()
      return
    }
    setDrafts(newDrafts)
    setPays(newPays)
    setPhase('review')
    toast.success(`読み取り完了：明細${newDrafts.length}件 / 請求書${newPays.length}件。内容を確認してください`)
  }

  function updateDraft(key: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => {
      if (d.key !== key) return d
      const next = { ...d, ...patch }
      // 下4桁が変わったら事業所を自動で再割り当て
      if (patch.card_last4 !== undefined) {
        const bid = cardStore.businessForLast4(patch.card_last4)
        if (bid) next.business_id = bid
      }
      return next
    }))
  }
  function removeDraft(key: number) {
    setDrafts((prev) => prev.filter((d) => d.key !== key))
  }
  function updatePay(key: number, patch: Partial<PayDraft>) {
    setPays((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  }
  function removePay(key: number) {
    setPays((prev) => prev.filter((p) => p.key !== key))
  }

  // バッチ内で「日付＋金額」が重複する＝突合候補（レシートとカード明細が両方ある等）
  const dupKeys = (() => {
    const count = new Map<string, number>()
    for (const d of drafts) {
      if (d.entry_type !== 'expense') continue
      const k = `${d.entry_date}|${d.amount}`
      count.set(k, (count.get(k) ?? 0) + 1)
    }
    return new Set(Array.from(count.entries()).filter(([, c]) => c > 1).map(([k]) => k))
  })()
  function isDup(d: Draft): boolean {
    return d.entry_type === 'expense' && dupKeys.has(`${d.entry_date}|${d.amount}`)
  }

  const validDrafts = drafts.filter((d) => d.amount > 0 && d.description)

  async function handleSave() {
    setSaving(true)
    try {
      if (validDrafts.length > 0) {
        await onSaveEntries(validDrafts.map((d) => ({
          business_id: d.business_id,
          entry_date: d.entry_date,
          entry_type: d.entry_type,
          category: d.category,
          vendor: d.vendor,
          description: d.description,
          amount: d.amount,
          payment_method: d.payment_method,
          source: d.source,
          card_last4: d.card_last4 || null,
          memo: null,
        })))
      }
      for (const p of pays) {
        if (p.amount > 0 && p.due_date) {
          await onSaveScheduledPayment({
            business_id: p.business_id,
            document_type: p.document_type,
            vendor: p.vendor,
            description: p.description,
            amount: p.amount,
            due_date: p.due_date,
            status: 'pending',
            memo: null,
          })
        }
      }
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  function businessCell(value: string | null, onChange: (v: string | null) => void) {
    return (
      <Select value={value ?? '__common__'} onValueChange={(v) => onChange(v === '__common__' ? null : v)}>
        <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__common__">全社共通</SelectItem>
          {businesses.filter((b) => b.is_active).map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>書類読み取り</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) void handleFiles(files)
          }}
        />

        {/* 1. 画像選択 */}
        {phase === 'select' && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl py-12 px-6 flex flex-col items-center gap-3 text-muted-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50/40 transition-colors"
          >
            <ScanLine className="w-8 h-8" />
            <div className="text-sm font-medium">書類を撮影またはアップロード（複数選択可）</div>
            <div className="text-xs leading-relaxed text-center">
              レシート・領収書 / クレジットカード利用明細 / 通帳 / 請求書・見積書をAIが自動で判別します<br />
              カードの下4桁から事業所へ自動仕分け。複数枚まとめてアップロードしても1枚ずつ判定します<br />
              <span className="text-amber-700">精度を上げるため、レシートは1枚ずつ・明るくピントを合わせて撮影してください</span>
            </div>
          </button>
        )}

        {/* 2. 読み取り中 */}
        {phase === 'loading' && (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">読み取り中... {progress.done}/{progress.total} 枚</p>
          </div>
        )}

        {/* 3. 確認・編集 */}
        {phase === 'review' && (
          <div className="space-y-4">
            {/* 出納帳ドラフト */}
            {drafts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">出納帳に登録（{validDrafts.length}件）</p>
                  {dupKeys.size > 0 && (
                    <span className="text-xs text-indigo-700 inline-flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5" />
                      日付・金額が一致する明細は1件に統合されます
                    </span>
                  )}
                </div>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-green-50/60">
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">日付</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">取込元</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">摘要</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">勘定科目</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">下4桁</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">事業所</th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">金額</th>
                        <th className="px-1 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {drafts.map((d) => {
                        const categoryOptions = d.entry_type === 'income' ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS
                        return (
                          <tr key={d.key} className={cn(isDup(d) && 'bg-indigo-50/40')}>
                            <td className="px-2 py-1.5">
                              <Input type="date" value={d.entry_date}
                                onChange={(e) => updateDraft(d.key, { entry_date: e.target.value })}
                                className="h-8 text-xs w-32" />
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-medium', SOURCE_BADGE[d.source])}>
                                {ENTRY_SOURCE_LABELS[d.source]}
                              </span>
                              {isDup(d) && <Link2 className="w-3 h-3 inline-block ml-1 text-indigo-600" />}
                            </td>
                            <td className="px-2 py-1.5">
                              <Input value={d.description}
                                onChange={(e) => updateDraft(d.key, { description: e.target.value })}
                                className="h-8 text-xs min-w-36" placeholder="摘要" />
                            </td>
                            <td className="px-2 py-1.5">
                              <Select value={d.category} onValueChange={(v) => updateDraft(d.key, { category: v as CashbookCategory })}>
                                <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(Object.entries(categoryOptions) as [CashbookCategory, string][]).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input value={d.card_last4}
                                onChange={(e) => updateDraft(d.key, { card_last4: e.target.value.replace(/\D/g, '').slice(-4) })}
                                className="h-8 text-xs w-16 text-center" placeholder="----" maxLength={4} />
                            </td>
                            <td className="px-2 py-1.5">
                              {businessCell(d.business_id, (v) => updateDraft(d.key, { business_id: v }))}
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" min={0} value={d.amount || ''}
                                onChange={(e) => updateDraft(d.key, { amount: Math.max(0, Number(e.target.value)) })}
                                className="h-8 text-xs text-right w-24" />
                            </td>
                            <td className="px-1 py-1.5">
                              <button type="button" onClick={() => removeDraft(d.key)}
                                className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 支払予定ドラフト（請求書・見積書） */}
            {pays.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold inline-flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-600" />
                  支払予定に登録（{pays.length}件）
                </p>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-amber-50/60">
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">振込期日</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">種別</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">請求元・摘要</th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">事業所</th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">金額</th>
                        <th className="px-1 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pays.map((p) => (
                        <tr key={p.key}>
                          <td className="px-2 py-1.5">
                            <Input type="date" value={p.due_date}
                              onChange={(e) => updatePay(p.key, { due_date: e.target.value })}
                              className="h-8 text-xs w-32" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Select value={p.document_type} onValueChange={(v) => updatePay(p.key, { document_type: v as DocumentType })}>
                              <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([k, label]) => (
                                  <SelectItem key={k} value={k}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5">
                            <Input value={p.vendor || p.description}
                              onChange={(e) => updatePay(p.key, { vendor: e.target.value })}
                              className="h-8 text-xs min-w-40" />
                          </td>
                          <td className="px-2 py-1.5">
                            {businessCell(p.business_id, (v) => updatePay(p.key, { business_id: v }))}
                          </td>
                          <td className="px-2 py-1.5">
                            <Input type="number" min={0} value={p.amount || ''}
                              onChange={(e) => updatePay(p.key, { amount: Math.max(0, Number(e.target.value)) })}
                              className="h-8 text-xs text-right w-24" />
                          </td>
                          <td className="px-1 py-1.5">
                            <button type="button" onClick={() => removePay(p.key)}
                              className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="gap-1.5" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5" />
                別の書類を読み取る
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={saving || (validDrafts.length === 0 && pays.length === 0)}>
                {saving ? '登録中...' : `登録する（出納帳${validDrafts.length}件 / 支払予定${pays.length}件）`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
