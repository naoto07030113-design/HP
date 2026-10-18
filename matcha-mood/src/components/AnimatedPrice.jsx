import { useEffect, useRef } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { yen } from '../lib/order.js'

// 価格変更時に数字がカウントアップ／ダウンする
export default function AnimatedPrice({ value, className = '' }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => yen(Math.round(v)))
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.35, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, mv])

  return <motion.span className={`tabular ${className}`} aria-label={yen(value)}>{text}</motion.span>
}
