import { useEffect, useRef, useState } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)
  const barRef = useRef()

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= 100) { clearInterval(interval); return 100 }
        return c + Math.floor(Math.random() * 5) + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(count, 100)}%`
    }
    if (count >= 100) {
      setTimeout(() => {
        setFading(true)
        setTimeout(() => onComplete?.(), 1000)
      }, 400)
    }
  }, [count, onComplete])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#111c10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 1.0s ease-in-out',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.8rem',
          fontWeight: 400,
          letterSpacing: '0.28em',
          color: 'rgba(244,240,232,0.75)',
          marginBottom: '0.6rem',
        }}
      >
        BIO PARK
      </div>

      {/* Sub-tagline */}
      <div
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.52rem',
          letterSpacing: '0.4em',
          color: 'rgba(138,184,128,0.4)',
          marginBottom: '4rem',
        }}
      >
        GREENHOUSE & NATURE
      </div>

      {/* Progress bar — thin and quiet */}
      <div
        style={{
          width: 160,
          height: 1,
          background: 'rgba(244,240,232,0.06)',
          position: 'relative',
          marginBottom: '1rem',
        }}
      >
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            height: '100%',
            width: '0%',
            background: 'rgba(138,184,128,0.55)',
            transition: 'width 0.08s linear',
          }}
        />
      </div>

      {/* Count */}
      <div
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.55rem',
          letterSpacing: '0.15em',
          color: 'rgba(244,240,232,0.15)',
        }}
      >
        {Math.min(count, 100)}
      </div>
    </div>
  )
}
