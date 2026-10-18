import { AnimatePresence, motion } from 'framer-motion'
import ProductImage from './ProductImage.jsx'

export default function Toast({ toast, onOpenCart, onClose }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white/95 p-2.5 pr-3 shadow-soft ring-1 ring-matcha-900/5 backdrop-blur"
            role="status"
          >
            <ProductImage src={toast.image} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.12em] text-matcha-700">カートに追加しました</p>
              <p className="truncate text-sm font-medium text-matcha-950">{toast.title}</p>
            </div>
            <button onClick={onOpenCart} className="shrink-0 rounded-full bg-matcha-900 px-3.5 py-2 text-xs font-bold text-lime-soft">
              カートを見る
            </button>
            <button onClick={onClose} aria-label="通知を閉じる" className="shrink-0 p-1 text-matcha-900/50 hover:text-matcha-900">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
