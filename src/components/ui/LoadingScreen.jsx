import { useEffect, useRef, useState } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)
  const barRef = useRef()

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= 100) { clearInterval(interval); return 100 }
        return Math.min(c + Math.floor(Math.random() * 5) + 2, 100)
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
        setTimeout(() => onComplete?.(), 1000)
      }, 400)
    }
  }, [count, onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: '#0d0602',
        opacity: fading ? 0 : 1,
        transition: 'opacity 1.0s ease-in-out',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Ornamental mark */}
      <div className="relative mb-12 flex items-center justify-center" style={{ width: 90, height: 90 }}>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(193,150,80,0.2)',
            animation: 'spinSlow 10s linear infinite',
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            border: '1px solid rgba(193,150,80,0.35)',
            animation: 'spinSlow 6s linear infinite reverse',
          }}
        />
        {/* Amber center dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#c17842',
            boxShadow: '0 0 20px rgba(193,120,66,0.65)',
            animation: 'flamePulse 2.8s ease-in-out infinite',
          }}
        />
        {/* Orbital decorations */}
        {[0, 72, 144, 216, 288].map((deg) => (
          <div
            key={deg}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'rgba(193,150,80,0.5)',
              top: '50%',
              left: '50%',
              marginTop: -1.5,
              marginLeft: -1.5,
              transformOrigin: '1.5px 1.5px',
              transform: `rotate(${deg}deg) translateY(-34px)`,
            }}
          />
        ))}
      </div>

      {/* Brand */}
      <div
        className="font-display"
        style={{
          fontSize: '1.9rem',
          fontWeight: 400,
          letterSpacing: '0.28em',
          color: '#f0e6d3',
          marginBottom: '0.4rem',
        }}
      >
        TRATTORIA
      </div>
      <div
        className="font-display"
        style={{
          fontSize: '1.35rem',
          fontWeight: 300,
          fontStyle: 'italic',
          letterSpacing: '0.18em',
          color: 'rgba(193,150,80,0.7)',
          marginBottom: '0.8rem',
        }}
      >
        La Costa
      </div>
      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.55rem',
          letterSpacing: '0.38em',
          color: 'rgba(193,150,80,0.4)',
          marginBottom: '3rem',
          textTransform: 'uppercase',
        }}
      >
        Amalfi Coast · Est. 1962
      </div>

      {/* Progress bar */}
      <div style={{ width: 180, height: 1, background: 'rgba(193,150,80,0.1)', position: 'relative' }}>
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '0%',
            background: 'linear-gradient(90deg, #8b5a2b, #c17842, #dda860)',
            transition: 'width 0.12s ease',
            boxShadow: '0 0 8px rgba(193,120,66,0.55)',
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.58rem',
          letterSpacing: '0.2em',
          color: 'rgba(240,220,180,0.22)',
          marginTop: '0.75rem',
        }}
      >
        {count < 100 ? `${Math.min(count, 100)}%` : 'Benvenuti'}
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes flamePulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}
