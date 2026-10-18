import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sheet from './Sheet.jsx'
import ProductImage from './ProductImage.jsx'
import { describe, yen } from '../lib/order.js'

const ORDER_TYPES = [
  { id: 'takeout', label: 'テイクアウト' },
  { id: 'eatin', label: 'イートイン' },
]
const PAYMENTS = [
  { id: 'store', label: '店頭でお支払い', note: 'お受け取り時にレジでお支払い' },
  { id: 'demo', label: 'デモ決済', note: '実際の決済・カード情報の入力はありません' },
]

function pickupSlots() {
  const now = new Date()
  const base = new Date(now.getTime() + 15 * 60000)
  base.setMinutes(Math.ceil(base.getMinutes() / 5) * 5, 0, 0)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getTime() + i * 10 * 60000)
    const label = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { id: label, label: i === 0 ? `${label}（最短）` : label }
  })
}

function Choice({ items, value, onChange, name }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((it) => (
        <button
          key={it.id}
          role="radio"
          aria-checked={value === it.id}
          onClick={() => onChange(it.id)}
          className={`rounded-2xl px-3 py-3 text-left transition ${value === it.id ? 'bg-matcha-900 text-lime-soft shadow-soft' : 'bg-white text-matcha-950 hover:bg-lime-pale'}`}
        >
          <span className="block text-sm font-bold">{it.label}</span>
          {it.note && <span className={`mt-0.5 block text-[11px] leading-snug ${value === it.id ? 'text-lime-soft/75' : 'text-matcha-900/55'}`}>{it.note}</span>}
        </button>
      ))}
    </div>
  )
}

export default function Checkout({ open, onClose, lines, total, onComplete, onFinish }) {
  const slots = useMemo(() => pickupSlots(), [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState('confirm')
  const [type, setType] = useState('takeout')
  const [slot, setSlot] = useState('')
  const [name, setName] = useState('')
  const [payment, setPayment] = useState('store')
  const [touched, setTouched] = useState(false)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (open) {
      setStep('confirm')
      setSlot(slots[0].id)
      setTouched(false)
    }
  }, [open, slots])

  const nameError = !name.trim() ? 'お名前を入力してください' : name.trim().length > 20 ? '20文字以内で入力してください' : ''

  const submit = () => {
    setTouched(true)
    if (nameError || lines.length === 0) return
    setStep('processing')
    // デモ: 実際の通信・決済は行わない
    setTimeout(() => {
      const no = String(Math.floor(100 + Math.random() * 900))
      const snapshot = { no, name: name.trim(), slot, type, payment, total, count: lines.reduce((s, l) => s + l.qty, 0) }
      setOrder(snapshot)
      setStep('done')
      onComplete()
    }, 1400)
  }

  const close = () => {
    if (step === 'processing') return
    if (step === 'done') onFinish()
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} label="注文確認" side="center">
      <AnimatePresence mode="wait" initial={false}>
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <div>
                <p className="font-caps text-[10px] tracking-[0.3em] text-matcha-900/60">CHECKOUT · DEMO</p>
                <h2 className="font-display text-2xl text-matcha-950">ご注文内容の確認</h2>
              </div>
              <button onClick={close} aria-label="閉じる" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-matcha-900 shadow-sm hover:bg-lime-pale">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
              <p className="rounded-2xl bg-sakura-100 px-4 py-2.5 text-[12px] leading-relaxed text-sakura-600">
                これはデモです。注文は店舗へ送信されず、決済も一切行われません。
              </p>

              <ul className="divide-y divide-matcha-900/10 rounded-2xl bg-white px-4">
                {lines.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 py-3">
                    <ProductImage src={l.product.image} alt={l.product.ja} className="h-12 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{l.product.ja} <span className="tabular font-normal text-matcha-900/60">× {l.qty}</span></p>
                      <p className="truncate text-[11px] text-matcha-900/60">{describe(l.selection).join(' / ') || '標準'}</p>
                    </div>
                    <p className="tabular shrink-0 text-sm">{yen(l.unit * l.qty)}</p>
                  </li>
                ))}
              </ul>

              <div>
                <p className="mb-2 text-[13px] font-bold tracking-[0.12em]">ご利用方法</p>
                <Choice name="ご利用方法" items={ORDER_TYPES} value={type} onChange={setType} />
              </div>

              <div>
                <label htmlFor="slot" className="mb-2 block text-[13px] font-bold tracking-[0.12em]">受け取り時間</label>
                <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="h-12 w-full rounded-2xl border-0 bg-white px-4 text-sm ring-1 ring-matcha-900/10 focus:ring-2 focus:ring-matcha-700">
                  {slots.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="mb-2 block text-[13px] font-bold tracking-[0.12em]">お呼び出し名 <span className="text-sakura-600">*</span></label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="例：まっちゃ"
                  autoComplete="nickname"
                  aria-invalid={touched && !!nameError}
                  aria-describedby="name-error"
                  className={`h-12 w-full rounded-2xl border-0 bg-white px-4 text-sm ring-1 focus:ring-2 focus:ring-matcha-700 ${touched && nameError ? 'ring-sakura-500' : 'ring-matcha-900/10'}`}
                />
                <p id="name-error" className="mt-1 min-h-[16px] text-[11px] text-sakura-600">{touched ? nameError : ''}</p>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-bold tracking-[0.12em]">お支払い方法</p>
                <Choice name="お支払い方法" items={PAYMENTS} value={payment} onChange={setPayment} />
              </div>
            </div>

            <div className="pb-safe border-t border-matcha-900/10 bg-white/70 px-5 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-matcha-900/70">お支払い合計（税込）</span>
                <span className="tabular font-display text-3xl">{yen(total)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={close} className="h-14 rounded-full bg-white px-5 text-sm font-bold text-matcha-900 ring-1 ring-matcha-900/15">戻る</button>
                <button onClick={submit} className="h-14 flex-1 rounded-full bg-matcha-900 text-[15px] font-bold tracking-[0.06em] text-lime-soft shadow-soft active:scale-[0.98]">
                  注文を確定する（デモ）
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center px-6 py-24 text-center" role="status">
            <motion.div
              className="h-16 w-16 rounded-full border-4 border-lime-soft border-t-matcha-800"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
            <p className="mt-6 font-medium">注文を準備しています…</p>
            <p className="mt-1 text-xs text-matcha-900/55">（デモ処理中・実際の送信はありません）</p>
          </motion.div>
        )}

        {step === 'done' && order && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="min-h-0 overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-b from-lime-soft to-cream px-6 pb-8 pt-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-matcha-900 text-lime-soft shadow-soft"
              >
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45 }} />
                </svg>
              </motion.div>
              <p className="mt-5 font-script text-4xl text-sakura-500">Thank you!</p>
              <h2 className="mt-1 text-xl font-bold">ご注文を受け付けました</h2>
              <p className="mt-1 text-xs text-matcha-900/60">※ デモのため、実際には店舗へ送信されていません</p>
            </div>
            <div className="px-6 pb-8">
              <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
                <p className="font-caps text-[10px] tracking-[0.3em] text-matcha-900/60">ORDER NO.</p>
                <p className="tabular font-display text-6xl text-matcha-950">{order.no}</p>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-left text-sm">
                  <dt className="text-matcha-900/60">お名前</dt><dd className="text-right font-medium">{order.name} 様</dd>
                  <dt className="text-matcha-900/60">受け取り</dt><dd className="text-right font-medium">{order.slot}・{ORDER_TYPES.find((t) => t.id === order.type).label}</dd>
                  <dt className="text-matcha-900/60">お支払い</dt><dd className="text-right font-medium">{PAYMENTS.find((p) => p.id === order.payment).label}</dd>
                  <dt className="text-matcha-900/60">合計（{order.count}点）</dt><dd className="tabular text-right font-display text-lg">{yen(order.total)}</dd>
                </dl>
              </div>
              <p className="mt-4 text-center text-sm text-matcha-900/80">抹茶で、ちょっといい一日を。</p>
              <button onClick={close} className="mt-5 h-14 w-full rounded-full bg-matcha-900 text-[15px] font-bold text-lime-soft shadow-soft">
                続けて注文する
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
