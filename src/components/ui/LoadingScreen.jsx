import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0)
  const containerRef = useRef()
  const barRef = useRef()

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= 100) {
          clearInterval(interval)
          return 100
        }
        return c + Math.floor(Math.random() * 8) + 2
      })
    }, 60)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${count}%`, duration: 0.3, ease: 'power2.out' })
    }

    if (count >= 100) {
      setTimeout(() => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 1,
          ease: 'power3.inOut',
          onComplete: () => onComplete?.(),
        })
      }, 400)
    }
  }, [count, onComplete])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: '#080d0b' }}
    >
      {/* Animated logo mark */}
      <div className="relative mb-10">
        <div
          className="w-20 h-20 rounded-full"
          style={{
            border: '1px solid rgba(201,168,76,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="w-14 h-14 rounded-full"
            style={{
              border: '1px solid rgba(82,183,136,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 4s linear infinite',
            }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: '#52b788',
                boxShadow: '0 0 20px #52b788, 0 0 40px rgba(82,183,136,0.4)',
                animation: 'glowPulse 2s ease-in-out infinite',
              }}
            />
          </div>
          {/* Orbit dot */}
          <div
            style={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              background: '#c9a84c',
              borderRadius: '50%',
              boxShadow: '0 0 10px #c9a84c',
              animation: 'orbit 2s linear infinite',
              top: '50%',
              left: '50%',
              transformOrigin: '28px 0px',
              marginLeft: '-3px',
              marginTop: '-3px',
            }}
          />
        </div>
      </div>

      {/* Brand name */}
      <div className="font-display text-white mb-2" style={{ fontSize: '1.4rem', fontWeight: 400, letterSpacing: '0.1em' }}>
        伊藤医療
      </div>
      <div className="label-tag mb-10" style={{ fontSize: '0.6rem' }}>
        Ito Medical Care · Initializing
      </div>

      {/* Progress bar */}
      <div
        className="relative"
        style={{ width: '180px', height: '1px', background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          ref={barRef}
          style={{
            height: '100%',
            width: '0%',
            background: 'linear-gradient(90deg, #2d8653, #c9a84c)',
            boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          }}
        />
      </div>

      <div
        className="font-body text-white/20 mt-3 font-light"
        style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}
      >
        {count < 100 ? `Loading environment...` : 'Ready'}
      </div>

      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(28px); }
          to { transform: rotate(360deg) translateX(28px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
