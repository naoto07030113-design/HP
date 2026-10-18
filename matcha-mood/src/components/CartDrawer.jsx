import { AnimatePresence, motion } from 'framer-motion'
import Sheet from './Sheet.jsx'
import ProductImage from './ProductImage.jsx'
import AnimatedPrice from './AnimatedPrice.jsx'
import { describe, yen } from '../lib/order.js'

export default function CartDrawer({ open, onClose, lines, onQty, onRemove, onClear, onCheckout, total, count }) {
  return (
    <Sheet open={open} onClose={onClose} label="カート">
      <div className="flex items-center justify-between border-b border-matcha-900/10 px-5 py-4">
        <div>
          <p className="font-caps text-[10px] tracking-[0.3em] text-matcha-900/60">YOUR ORDER</p>
          <h2 className="font-display text-2xl text-matcha-950">カート <span className="tabular text-base text-matcha-900/60">({count}点)</span></h2>
        </div>
        <button onClick={onClose} aria-label="カートを閉じる" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-matcha-900 shadow-sm hover:bg-lime-pale">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <svg viewBox="0 0 40 40" className="h-14 w-14 text-matcha-500/60" aria-hidden><path d="M6 33C5 18 15 7 34 6c1 17-10 28-28 27z" fill="currentColor" /></svg>
            <p className="mt-4 font-medium text-matcha-950">カートは空です</p>
            <p className="mt-1 text-sm text-matcha-900/60">お好きな一杯を選んでみてください。</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-matcha-900 px-6 py-3 text-sm font-bold text-lime-soft">メニューを見る</button>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                  className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"
                >
                  <ProductImage src={l.product.image} alt={l.product.ja} className="h-20 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-matcha-950">{l.product.ja}</p>
                        <p className="truncate font-display text-[12px] text-matcha-900/60">{l.product.name}</p>
                      </div>
                      <button onClick={() => onRemove(l.key)} aria-label={`${l.product.ja}を削除`} className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-matcha-900/40 hover:bg-sakura-100 hover:text-sakura-600">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                      </button>
                    </div>
                    {describe(l.selection).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {describe(l.selection).map((d) => (
                          <span key={d} className="rounded-full bg-lime-pale px-2 py-0.5 text-[10px] text-matcha-900">{d}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full bg-cream">
                        <button onClick={() => (l.qty <= 1 ? onRemove(l.key) : onQty(l.key, l.qty - 1))} aria-label="数量を減らす" className="flex h-8 w-8 items-center justify-center rounded-full text-matcha-900 hover:bg-white">−</button>
                        <span className="tabular w-6 text-center text-sm font-bold">{l.qty}</span>
                        <button onClick={() => onQty(l.key, l.qty + 1)} disabled={l.qty >= 20} aria-label="数量を増やす" className="flex h-8 w-8 items-center justify-center rounded-full text-matcha-900 hover:bg-white disabled:opacity-30">+</button>
                      </div>
                      <p className="tabular font-display text-base text-matcha-950">{yen(l.unit * l.qty)}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {lines.length > 0 && (
          <button onClick={onClear} className="mt-4 text-xs text-matcha-900/55 underline underline-offset-4 hover:text-sakura-600">
            カートを空にする
          </button>
        )}
      </div>

      {lines.length > 0 && (
        <div className="pb-safe border-t border-matcha-900/10 bg-white/70 px-5 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-matcha-900/70">合計（税込）</span>
            <AnimatedPrice value={total} className="font-display text-3xl text-matcha-950" />
          </div>
          <button onClick={onCheckout} className="mt-3 h-14 w-full rounded-full bg-matcha-900 text-[15px] font-bold tracking-[0.08em] text-lime-soft shadow-soft active:scale-[0.98]">
            注文内容を確認する
          </button>
        </div>
      )}
    </Sheet>
  )
}
