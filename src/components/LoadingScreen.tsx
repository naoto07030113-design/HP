import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

interface Props {
  onComplete: () => void
}

const WORDS = ['Cultivate', 'Ferment', 'Experience']

export default function LoadingScreen({ onComplete }: Props) {
  const overlayRef  = useRef<HTMLDivElement>(null)
  const counterRef  = useRef<HTMLSpanElement>(null)
  const barRef      = useRef<HTMLDivElement>(null)
  const wordRef     = useRef<HTMLSpanElement>(null)

  const [wordIndex, setWordIndex] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)

  /* ── rotating words ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(i => (i + 1) % WORDS.length)
    }, 820)
    return () => clearInterval(interval)
  }, [])

  /* ── main GSAP timeline ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const obj = { value: 0 }

      const tl = gsap.timeline()

      /* 1. count up */
      tl.to(obj, {
        value: 100,
        duration: 2.4,
        ease: 'power2.inOut',
        onUpdate() {
          const v = Math.round(obj.value)
          setDisplayCount(v)
          if (counterRef.current) {
            counterRef.current.textContent = String(v).padStart(3, '0')
          }
          if (barRef.current) {
            barRef.current.style.transform = `scaleX(${v / 100})`
          }
        },
      })

      /* 2. brief pause */
      tl.to({}, { duration: 0.25 })

      /* 3. exit — overlay slides up */
      tl.to(overlayRef.current, {
        yPercent: -100,
        duration: 1.1,
        ease: 'power4.inOut',
        onComplete,
      })
    }, overlayRef)

    return () => ctx.revert()
  }, [onComplete])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0B130B' }}
    >
      {/* ── atmospheric radial glow ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,178,107,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── top monogram ── */}
      <div className="mb-16 flex flex-col items-center gap-3">
        {/* ring with gradient border */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(92,138,99,0.15), rgba(201,178,107,0.15))',
            border: '1px solid rgba(141,175,116,0.25)',
          }}
        >
          <span
            className="text-sm font-semibold tracking-widest"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: 'linear-gradient(135deg, #8DAF74, #C9B26B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            BP
          </span>
        </div>
      </div>

      {/* ── counter ── */}
      <div className="relative flex items-end gap-2 mb-4" style={{ lineHeight: 1 }}>
        <span
          ref={counterRef}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(5rem, 14vw, 9rem)',
            color: '#F5F3EC',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          000
        </span>
      </div>

      {/* ── rotating word ── */}
      <div className="h-6 overflow-hidden mb-16">
        <span
          ref={wordRef}
          key={wordIndex}
          className="block eyebrow"
          style={{
            animation: 'fadeSlideUp 0.5s var(--ease-cinematic) both',
          }}
        >
          {WORDS[wordIndex]}
        </span>
      </div>

      {/* ── progress bar ── */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-px overflow-hidden"
        style={{ background: 'rgba(141,175,116,0.12)' }}
      >
        <div
          ref={barRef}
          className="h-full origin-left"
          style={{
            background: 'linear-gradient(90deg, #5C8A63 0%, #8DAF74 45%, #C9B26B 100%)',
            transform: 'scaleX(0)',
          }}
        />
      </div>

      {/* ── inline keyframe for word fade ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
