import { forwardRef } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'
import Logo from './Logo.jsx'

const Header = forwardRef(function Header({ count, bump, onOpenCart }, cartRef) {
  const controls = useAnimationControls()

  useEffect(() => {
    if (bump) controls.start({ scale: [1, 1.22, 0.94, 1], rotate: [0, -8, 6, 0], transition: { duration: 0.55 } })
  }, [bump, controls])

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-white/40 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="MATCHA MOOD トップへ">
          <Logo />
        </a>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-matcha-800/15 px-3 py-1 font-caps text-[10px] tracking-[0.2em] text-matcha-900/70 sm:inline">
            DEMO ORDER
          </span>
          <motion.button
            ref={cartRef}
            animate={controls}
            whileTap={{ scale: 0.92 }}
            onClick={onOpenCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-matcha-900 text-lime-soft shadow-soft"
            aria-label={`カートを開く（${count}点）`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" />
              <path d="M9 8V6.5a3 3 0 016 0V8" />
            </svg>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="tabular absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sakura-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  )
})

export default Header
