'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Package, ShoppingCart, Check, Plus, Minus } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useMerchandiseStore, merchandiseBookingsStore } from '@/lib/merchandise-store'
import { cn } from '@/lib/utils'
import type { Merchandise } from '@/types/merchandise'

type Step = 'select' | 'info' | 'confirm' | 'complete'

export default function MerchandisePage() {
  const { clinicId } = useParams<{ clinicId: string }>()
  const router = useRouter()
  const { clinics } = useClinicStore()
  const store = useMerchandiseStore()

  const clinic = clinics.find((c) => c.id === clinicId)
  const availableItems = store.merchandise.filter((m) => m.clinic_id === clinicId && m.is_active)

  const [step, setStep] = useState<Step>('select')
  const [cart, setCart] = useState<Map<string, number>>(new Map())
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function adjustQty(id: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev)
      const current = next.get(id) ?? 0
      const newQty = Math.max(0, current + delta)
      if (newQty === 0) {
        next.delete(id)
      } else {
        next.set(id, newQty)
      }
      return next
    })
  }

  const cartItems = availableItems
    .filter((m) => (cart.get(m.id) ?? 0) > 0)
    .map((m) => ({ merchandise: m, quantity: cart.get(m.id)! }))

  const totalPrice = cartItems.reduce((sum, { merchandise, quantity }) => sum + merchandise.price * quantity, 0)

  async function handleSubmit() {
    if (!patientName.trim()) { setError('お名前を入力してください'); return }
    setSubmitting(true)
    setError(null)
    try {
      for (const { merchandise, quantity } of cartItems) {
        await merchandiseBookingsStore.create({
          merchandise_id: merchandise.id,
          clinic_id: clinicId,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim() || null,
          patient_id: null,
          quantity,
          status: 'pending',
          notes: notes.trim() || null,
        })
      }
      setStep('complete')
    } catch {
      setError('予約に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--surface))] to-white">
      {/* ヘッダー */}
      <header className="relative bg-gradient-to-br from-green-950 via-green-900 to-[#16382a] text-white px-4 pt-8 pb-9 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(400px circle at 85% 0%, rgba(207,166,79,0.1), transparent 55%)' }}
        />
        <div className="relative max-w-lg mx-auto">
          <button
            onClick={() => step === 'select' ? router.back() : setStep('select')}
            className="flex items-center gap-1.5 text-green-200/70 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'select' ? '院の選択に戻る' : '商品選択に戻る'}
          </button>
          <p className="text-[10px] text-gold-300/80 tracking-[0.3em] mb-1">ITO MEDICAL CARE</p>
          <h1 className="text-2xl font-bold tracking-tight">物販予約</h1>
          {clinic && <p className="text-green-200/80 text-sm mt-1.5">{clinic.name}</p>}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 animate-fade-up">
        {/* 商品選択 */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-green-950 mb-1">商品を選択</h2>
              <p className="text-xs text-muted-foreground mb-4">ご希望の商品と数量を選択してください</p>

              {availableItems.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 text-green-200" />
                  <p className="text-sm">現在取り扱い商品がありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableItems.map((m) => {
                    const qty = cart.get(m.id) ?? 0
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'bg-white rounded-2xl border shadow-sm p-4 transition-all duration-200',
                          qty > 0 ? 'border-green-300 shadow-green-100/60' : 'border-green-100',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 ring-1 ring-pink-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Package className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-green-950">{m.name}</p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>
                            )}
                            <p className="text-sm font-bold text-green-700 mt-1">¥{m.price.toLocaleString()}</p>
                            {m.stock !== null && (
                              <p className="text-xs text-muted-foreground">在庫: {m.stock}個</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => adjustQty(m.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-full border border-green-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-green-400 hover:bg-green-50 transition-all"
                            >
                              <Minus className="w-3.5 h-3.5 text-green-700" />
                            </button>
                            <span className="w-6 text-center font-bold text-green-950">{qty}</span>
                            <button
                              onClick={() => adjustQty(m.id, 1)}
                              disabled={m.stock !== null && qty >= m.stock}
                              className="w-8 h-8 rounded-full border border-green-200 bg-white flex items-center justify-center disabled:opacity-30 hover:border-green-400 hover:bg-green-50 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5 text-green-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="sticky bottom-4">
                <button
                  onClick={() => setStep('info')}
                  className="w-full bg-gradient-to-r from-green-700 to-green-900 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-semibold">{cartItems.length}種類を選択中</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-green-200/80">次へ進む</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 情報入力 */}
        {step === 'info' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-green-950 mb-1">お客様情報</h2>
              <p className="text-xs text-muted-foreground mb-4">受け取り時に必要な情報を入力してください</p>
            </div>

            {/* カート確認 */}
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-2.5">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">ご注文内容</p>
              {cartItems.map(({ merchandise, quantity }) => (
                <div key={merchandise.id} className="flex items-center justify-between text-sm">
                  <span className="text-green-950">{merchandise.name} × {quantity}</span>
                  <span className="font-semibold text-green-900">¥{(merchandise.price * quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-green-50 pt-2.5 mt-2.5 flex items-center justify-between">
                <span className="font-semibold text-green-950">合計</span>
                <span className="font-bold text-green-900 text-base">¥{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patient-name">お名前 <span className="text-red-500">*</span></Label>
                <Input
                  id="patient-name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patient-phone">電話番号（任意）</Label>
                <Input
                  id="patient-phone"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="090-0000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">備考（任意）</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ご要望・連絡事項など"
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base"
              onClick={() => {
                if (!patientName.trim()) { setError('お名前を入力してください'); return }
                setError(null)
                setStep('confirm')
              }}
            >
              確認画面へ
            </Button>
          </div>
        )}

        {/* 確認画面 */}
        {step === 'confirm' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-green-950 mb-1">予約内容の確認</h2>
              <p className="text-xs text-muted-foreground mb-4">内容をご確認の上、予約を確定してください</p>
            </div>

            <div className="bg-white rounded-2xl border border-green-100 shadow-sm divide-y divide-green-50">
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">ご注文内容</p>
                {cartItems.map(({ merchandise, quantity }) => (
                  <div key={merchandise.id} className="flex justify-between text-sm">
                    <span>{merchandise.name} × {quantity}</span>
                    <span className="font-medium">¥{(merchandise.price * quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1 border-t border-green-50 text-green-900">
                  <span>合計</span>
                  <span>¥{totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">お客様情報</p>
                <div className="flex gap-3 text-sm">
                  <span className="text-muted-foreground w-20 flex-shrink-0">お名前</span>
                  <span className="font-medium">{patientName}</span>
                </div>
                {patientPhone && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-20 flex-shrink-0">電話番号</span>
                    <span>{patientPhone}</span>
                  </div>
                )}
                {notes && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-20 flex-shrink-0">備考</span>
                    <span>{notes}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-2.5">
              <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '送信中...' : '予約を確定する'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('info')}>
                戻る
              </Button>
            </div>
          </div>
        )}

        {/* 完了画面 */}
        {step === 'complete' && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 ring-4 ring-green-100 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-950 mb-2">予約が完了しました</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ご予約を受け付けました。<br />
                院のスタッフよりご連絡させていただく場合がございます。
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 text-left space-y-2">
              {cartItems.map(({ merchandise, quantity }) => (
                <div key={merchandise.id} className="flex justify-between text-sm">
                  <span>{merchandise.name} × {quantity}</span>
                  <span className="font-medium">¥{(merchandise.price * quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/reserve/${clinicId}`)}>
              予約ページに戻る
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
