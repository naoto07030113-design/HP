'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import type { Invoice } from '@/types/accounting'
import { PAYMENT_METHOD_LABELS, INSURANCE_TYPE_LABELS } from '@/types/accounting'
import { useClinicStore } from '@/lib/clinic-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice
}

export function ReceiptDialog({ open, onOpenChange, invoice }: Props) {
  const { clinics, staff } = useClinicStore()
  const clinic = clinics.find((c) => c.id === invoice.clinic_id)
  const staffMember = staff.find((s) => s.id === invoice.staff_id)
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const el = printRef.current
    if (!el) return
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>領収書 ${invoice.invoice_number}</title>
      <style>
        body { font-family: 'Hiragino Kaku Gothic Pro', Meiryo, sans-serif; font-size: 13px; color: #111; padding: 24px; max-width: 360px; margin: 0 auto; }
        h1 { font-size: 20px; text-align: center; margin: 0 0 4px; }
        .center { text-align: center; }
        .section { margin: 16px 0; border-top: 1px solid #333; padding-top: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 3px 0; vertical-align: top; }
        td:last-child { text-align: right; }
        .total-row td { border-top: 1px solid #999; padding-top: 6px; font-weight: bold; font-size: 15px; }
        .label { color: #666; font-size: 11px; }
        .footer { margin-top: 24px; font-size: 11px; color: #666; text-align: center; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const payBase = invoice.insurance_type === 'none' ? invoice.total_amount : invoice.insurance_copay

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>領収書</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              印刷
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="font-mono text-sm space-y-4">
          {/* 院名・タイトル */}
          <div className="text-center space-y-1">
            <p className="text-base font-bold">{clinic?.name ?? '鍼灸整骨院'}</p>
            {clinic?.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
            {clinic?.phone && <p className="text-xs text-muted-foreground">{clinic.phone}</p>}
            <h2 className="text-2xl font-bold tracking-widest mt-3">領  収  書</h2>
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">患者名</span>
              <span className="font-medium">{invoice.patient_name} 様</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">来院日</span>
              <span>{invoice.visit_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">担当</span>
              <span>{staffMember?.name ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">伝票番号</span>
              <span className="text-xs">{invoice.invoice_number}</span>
            </div>
          </div>

          {/* 明細 */}
          <div className="space-y-1.5">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">× {item.quantity}</span>
                  )}
                </div>
                <div className="flex-shrink-0 text-right ml-4">
                  {item.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through mr-2">
                      ¥{(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  )}
                  <span>¥{item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 合計 */}
          <div className="border-t border-dashed border-gray-400 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>小計</span>
              <span>¥{invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-red-600">
                <span>割引</span>
                <span>-¥{invoice.discount_total.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>消費税（10%）</span>
              <span>¥{invoice.tax_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-400 pt-2">
              <span>合計</span>
              <span>¥{invoice.total_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* 支払情報 */}
          <div className="border-t border-dashed border-gray-400 pt-3 space-y-1.5 text-sm">
            {invoice.insurance_type !== 'none' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">保険区分</span>
                <span>{INSURANCE_TYPE_LABELS[invoice.insurance_type]}</span>
              </div>
            )}
            {invoice.insurance_type !== 'none' && (
              <div className="flex justify-between font-medium">
                <span>患者負担額</span>
                <span>¥{invoice.insurance_copay.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">支払方法</span>
              <span>{PAYMENT_METHOD_LABELS[invoice.payment_method]}</span>
            </div>
            {invoice.payment_method === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">お預かり</span>
                  <span>¥{invoice.payment_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>お釣り</span>
                  <span>¥{invoice.change_amount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {invoice.memo && (
            <div className="border-t pt-2 text-xs text-muted-foreground">
              <p>{invoice.memo}</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2 border-t">
            ご来院ありがとうございました
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
