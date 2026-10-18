import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// モバイルは下から、PC は右からスライドするシート
export default function Sheet({ open, onClose, label, children, side = 'right' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const wrap = side === 'center' ? 'items-end justify-center sm:items-center sm:p-6' : 'items-end sm:items-stretch sm:justify-end'
  const panel =
    side === 'center'
      ? 'max-h-[92dvh] rounded-t-[28px] sm:max-h-[88vh] sm:w-[520px] sm:rounded-[28px]'
      : 'max-h-[88dvh] rounded-t-[28px] sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-[28px]'

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-40 flex ${wrap}`}>
          <motion.div
            className="absolute inset-0 bg-matcha-950/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: side === 'center' ? 40 : 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: side === 'center' ? 40 : 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`relative flex w-full flex-col overflow-hidden bg-cream shadow-2xl ${panel}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
