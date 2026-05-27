import { useEffect, useRef, useState } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)
  const barRef = useRef()

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= 100) { clearInterval(interval); return 100 }
        return c + Math.floor(Math.random() * 6) + 2
      })
    }, 55)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(count, 100)}%`
    }
    if (count >= 100) {
      setTimeout(() => {
        setFading(true)
        setTimeout(() => onComplete?.(), 900)
      }, 350)
    }
  }, [count, onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: '#1a2e18',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.9s ease-in-out',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Botanical logo mark */}
      <div className="relative mb-12 flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(138,184,128,0.25)',
            animation: 'spinSlow 8s linear infinite',
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            border: '1px solid rgba(138,184,128,0.45)',
            animation: 'spinSlow 5s linear infinite reverse',
          }}
        />
        {/* Center leaf dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#6ab850',
            boxShadow: '0 0 18px rgba(106,184,80,0.5)',
            animation: 'leafPulse 2.5s ease-in-out infinite',
          }}
        />
        {/* Four orbital dots */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'rgba(138,184,128,0.6)',
              top: '50%',
              left: '50%',
              transformOrigin: '2px 2px',
              transform: `rotate(${deg}deg) translateY(-30px)`,
            }}
          />
        ))}
      </div>

      {/* Brand name */}
      <div
        className="font-display text-cream mb-1"
        style={{
          fontSize: '2.1rem',
          fontWeight: 400,
          letterSpacing: '0.22em',
          color: '#f4f0e8',
        }}
      >
        BIO PARK
      </div>
      <div
        className="font-body text-sage mb-12"
        style={{ fontSize: '0.58rem', letterSpacing: '0.35em', color: '#8ab880' }}
      >
        Entering the Greenhouse
      </div>

      {/* Progress bar */}
      <div style={{ width: 200, height: 1, background: 'rgba(255,255,255,0.07)', position: 'relative' }}>
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            height: '100%',
            width: '0%',
            background: 'linear-gradient(90deg, #3a7a30, #6ab850, #8ab880)',
            transition: 'width 0.1s ease',
            boxShadow: '0 0 6px rgba(106,184,80,0.5)',
          }}
        />
      </div>
      <div
        className="font-body mt-3"
        style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'rgba(244,240,232,0.2)' }}
      >
        {count < 100 ? `${Math.min(count, 100)}%` : 'Ready'}
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes leafPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
