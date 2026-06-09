'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'
import type { Invoice } from '@/types/accounting'
import { PAYMENT_METHOD_LABELS, INSURANCE_TYPE_LABELS } from '@/types/accounting'
import { useClinicStore } from '@/lib/clinic-store'
import { useSettingsStore } from '@/lib/settings-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice
}

const PRINT_STYLE = `
  @page { size: A5; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Hiragino Kaku Gothic Pro', 'Noto Sans JP', Meiryo, sans-serif; font-size: 12px; color: #111; margin: 0; }
  .receipt { max-width: 148mm; }
  .center { text-align: center; }
  .title { font-size: 22px; font-weight: bold; letter-spacing: 0.3em; text-align: center; margin: 12px 0; }
  .divider { border: none; border-top: 1px solid #aaa; margin: 10px 0; }
  .divider-dashed { border: none; border-top: 1px dashed #aaa; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .label { color: #555; }
  .items { margin: 8px 0; }
  .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; border-top: 1px solid #555; padding-top: 6px; margin-top: 6px; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px dashed #aaa; padding-top: 10px; }
  .company { font-size: 14px; font-weight: bold; }
  .sub { font-size: 10px; color: #666; }
  .amount-box { border: 2px solid #111; padding: 8px 16px; text-align: center; margin: 12px 0; font-size: 18px; font-weight: bold; }
`

export function ReceiptDialog({ open, onOpenChange, invoice }: Props) {
  const { clinics, staff } = useClinicStore()
  const settings = useSettingsStore()
  const clinic = clinics.find((c) => c.id === invoice.clinic_id)
  const staffMember = staff.find((s) => s.id === invoice.staff_id)
  const printRef = useRef<HTMLDivElement>(null)

  const payBase = invoice.insurance_type === 'none' ? invoice.total_amount : invoice.insurance_copay

  function buildReceiptHTML(content: string) {
    return `<!DOCTYPE html><html lang="ja"><head>
      <meta charset="utf-8">
      <title>領収書 ${invoice.invoice_number}</title>
      <style>${PRINT_STYLE}</style>
    </head><body><div class="receipt">${content}</div></body></html>`
  }

  function getReceiptContent() {
    const el = printRef.current
    return el ? el.innerHTML : ''
  }

  function handlePrint() {
    const content = getReceiptContent()
    if (!content) return
    const win = window.open('', '_blank', 'width=600,height=800')
    if (!win) return
    win.document.write(buildReceiptHTML(content))
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  function handleDownload() {
    const content = getReceiptContent()
    if (!content) return
    const html = buildReceiptHTML(content)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `領収書_${invoice.patient_name}_${invoice.visit_date}_${invoice.invoice_number}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>領収書</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5" />
                保存
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" />
                印刷/PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="font-mono text-sm space-y-3 bg-white">
          {/* ヘッダー */}
          <div className="text-center space-y-0.5">
            <p className="text-base font-bold">{clinic?.name ?? settings.companyName}</p>
            {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
            {clinic?.phone && <p className="text-xs text-muted-foreground">{clinic.phone}</p>}
            <h2 className="text-2xl font-bold tracking-[0.3em] mt-3">領  収  書</h2>
          </div>

          {/* 受領金額 */}
          <div className="border-2 border-gray-800 rounded py-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">お受け取り金額</p>
            <p className="text-2xl font-bold tracking-wide">
              ¥{payBase.toLocaleString()}
              <span className="text-sm font-normal ml-1">（税込）</span>
            </p>
          </div>

          {/* 基本情報 */}
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-sm">
            <ReceiptRow label="患者名" value={`${invoice.patient_name} 様`} bold />
            <ReceiptRow label="来院日" value={invoice.visit_date} />
            <ReceiptRow label="担当" value={staffMember?.name ?? '-'} />
            <ReceiptRow label="伝票番号" value={invoice.invoice_number} small />
          </div>

          {/* 明細 */}
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5 text-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">治療明細</p>
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">× {item.quantity}</span>
                  )}
                </div>
                <div className="flex-shrink-0 text-right ml-4 space-x-2">
                  {item.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      ¥{(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  )}
                  <span>¥{item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 合計 */}
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5 text-sm">
            <ReceiptRow label="小計" value={`¥${invoice.subtotal.toLocaleString()}`} muted />
            {invoice.discount_total > 0 && (
              <ReceiptRow label="割引" value={`-¥${invoice.discount_total.toLocaleString()}`} red />
            )}
            <ReceiptRow
              label={`消費税（${Math.round(Number(invoice.tax_rate) * 100)}%）`}
              value={`¥${invoice.tax_amount.toLocaleString()}`}
              muted
            />
            <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2">
              <span>合計</span>
              <span>¥{invoice.total_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* 支払情報 */}
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5 text-sm">
            {invoice.insurance_type !== 'none' && (
              <>
                <ReceiptRow label="保険区分" value={INSURANCE_TYPE_LABELS[invoice.insurance_type]} muted />
                <ReceiptRow label="患者負担額" value={`¥${invoice.insurance_copay.toLocaleString()}`} bold />
              </>
            )}
            <ReceiptRow label="支払方法" value={PAYMENT_METHOD_LABELS[invoice.payment_method]} muted />
            {invoice.payment_method === 'cash' && (
              <>
                <ReceiptRow label="お預かり" value={`¥${invoice.payment_amount.toLocaleString()}`} muted />
                <ReceiptRow label="お釣り" value={`¥${invoice.change_amount.toLocaleString()}`} />
              </>
            )}
          </div>

          {invoice.memo && (
            <div className="border-t pt-2 text-xs text-muted-foreground">
              <p>{invoice.memo}</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2 border-t border-dashed border-gray-200">
            ご来院ありがとうございました
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReceiptRow({
  label, value, bold, muted, red, small,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
  red?: boolean
  small?: boolean
}) {
  return (
    <div className={`flex justify-between ${small ? 'text-xs' : ''}`}>
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-medium' : ''} ${muted ? 'text-muted-foreground' : ''} ${red ? 'text-red-600' : ''}`}>
        {value}
      </span>
    </div>
  )
}
