import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProductImage from './ProductImage.jsx'
import { SIZES, TOPPINGS } from '../data/menu.js'
import { yen } from '../lib/order.js'

const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 420

const slide = {
  enter: (d) => ({ x: d * 140, opacity: 0, scale: 0.92, rotate: d * 3 }),
  center: { x: 0, opacity: 1, scale: 1, rotate: 0 },
  exit: (d) => ({ x: d * -140, opacity: 0, scale: 0.92, rotate: d * -3 }),
}

// トッピングの写真チップを置く位置（アーチ枠の周囲）
const CHIP_SLOTS = [
  'left-[-6%] top-[18%]',
  'right-[-6%] top-[30%]',
  'left-[-4%] bottom-[22%]',
  'right-[-4%] bottom-[10%]',
]

const HeroGallery = forwardRef(function HeroGallery(
  { products, index, direction, selection, onPrev, onNext, onSelectIndex },
  imageRef,
) {
  const product = products[index]
  const size = SIZES.find((s) => s.id === selection.size)
  const scale = size ? size.scale : 0.96

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onNext()
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onPrev()
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="商品ギャラリー"
      className="relative"
    >
      {/* テキスト */}
      <div className="relative z-10 min-h-[128px] sm:min-h-[168px]">
        <p className="font-caps text-[11px] tracking-[0.32em] text-matcha-900/70">
          {product.category === 'drink' ? 'DRINK' : 'SWEETS'} · {String(index + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
          >
            <h1 className="mt-2 font-display text-[34px] leading-[0.98] tracking-tight text-matcha-950 sm:text-[52px] lg:text-[60px]">
              {product.name}
            </h1>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="text-base font-medium tracking-[0.12em] text-matcha-950">{product.ja}</p>
              <p className="tabular font-display text-xl text-matcha-950">{yen(product.price)}〜</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ステージ */}
      <div className="relative mx-auto mt-2 aspect-[4/5] w-full max-w-[320px] select-none sm:max-w-[440px]">
        <p className="pointer-events-none absolute -left-1 top-[6%] z-20 -rotate-6 font-script text-[38px] leading-none text-sakura-500 sm:text-[54px]">
          Good Matcha
        </p>

        {product.seasonal && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
            className="absolute right-0 top-[2%] z-20 flex h-20 w-20 flex-col sm:h-24 sm:w-24 items-center justify-center rounded-full bg-sakura-500/90 text-center text-white shadow-card"
          >
            <span className="text-[10px] tracking-[0.2em]">期間限定</span>
            <span className="mt-0.5 text-[12px] font-bold leading-tight sm:text-[13px]">いちご<br />抹茶ラテ</span>
            <span className="mt-0.5 font-caps text-[8px] tracking-[0.25em]">SEASONAL</span>
          </motion.div>
        )}

        <motion.div
          className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={product.id}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              className="absolute inset-0 flex items-end justify-center"
            >
              <motion.div
                ref={imageRef}
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                style={{ originY: 1 }}
                className="relative h-[92%] w-[74%]"
              >
                <ProductImage
                  src={product.image}
                  alt={`${product.ja}の商品写真`}
                  className="h-full w-full rounded-b-[36px] rounded-t-full shadow-soft ring-[6px] ring-white/70"
                />
                <AnimatePresence>
                  {selection.toppings.slice(0, CHIP_SLOTS.length).map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ scale: 0, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                      className={`absolute ${CHIP_SLOTS[i]} flex flex-col items-center`}
                    >
                      <ProductImage
                        src={TOPPINGS[t].image}
                        alt={TOPPINGS[t].label}
                        compact
                        className="h-14 w-14 rounded-full bg-white shadow-card ring-4 ring-white sm:h-16 sm:w-16"
                      />
                      <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-matcha-900 shadow-sm">
                        +{TOPPINGS[t].label}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {size && (
                  <motion.span
                    key={size.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-matcha-900/85 px-3 py-1 font-caps text-[11px] tracking-[0.2em] text-lime-soft"
                  >
                    SIZE {size.label} · {size.note}
                  </motion.span>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <button
          onClick={onPrev}
          aria-label="前の商品"
          className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-matcha-900 shadow-card backdrop-blur transition hover:bg-white active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button
          onClick={onNext}
          aria-label="次の商品"
          className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-matcha-900 shadow-card backdrop-blur transition hover:bg-white active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="mx-auto mt-4 max-w-sm text-center text-[13px] leading-relaxed text-matcha-950/80">{product.copy}</p>

      {/* ドット */}
      <div className="mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="商品を選択">
        {products.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={i === index}
            aria-label={p.ja}
            onClick={() => onSelectIndex(i)}
            className="flex h-6 items-center px-0.5"
          >
            <motion.span
              animate={{ width: i === index ? 22 : 6, opacity: i === index ? 1 : 0.35 }}
              className="block h-1.5 rounded-full bg-matcha-900"
            />
          </button>
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-matcha-900/55 lg:hidden">← スワイプで商品を切り替え →</p>
    </section>
  )
})

export default HeroGallery
