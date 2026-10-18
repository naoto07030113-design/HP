import { AnimatePresence, motion } from 'framer-motion'

// 商品写真がカートボタンへ放物線を描いて飛ぶ演出
export default function FlyToCart({ flights, onDone }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <AnimatePresence>
        {flights.map((f) => {
          const dx = f.to.x - f.from.x
          const dy = f.to.y - f.from.y
          return (
            <motion.div
              key={f.id}
              initial={{ x: f.from.x, y: f.from.y, scale: 1, opacity: 1 }}
              animate={{
                x: [f.from.x, f.from.x + dx * 0.45, f.to.x],
                y: [f.from.y, f.from.y + dy * 0.2 - 90, f.to.y],
                scale: [1, 0.7, 0.18],
                opacity: [1, 1, 0.4],
              }}
              transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] }}
              onAnimationComplete={() => onDone(f.id)}
              className="absolute left-0 top-0 -ml-12 -mt-12 h-24 w-24 overflow-hidden rounded-full shadow-soft ring-4 ring-white"
            >
              {f.image ? <img src={f.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-lime-soft" />}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
