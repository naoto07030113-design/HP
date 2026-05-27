import { useEffect, useState } from 'react'

// Minimal — just a thin progress line and tiny dots
export default function ScrollProgress({ scrollRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf
    const update = () => {
      setProgress(scrollRef.current)
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef])

  return (
    <div
      style={{
        position: 'fixed',
        right: '1.8rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.6rem',
      }}
    >
      {/* Progress track */}
      <div
        style={{
          position: 'relative',
          width: 1,
          height: 110,
          background: 'rgba(244,240,232,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: `${progress * 100}%`,
            background: 'rgba(244,240,232,0.30)',
            transition: 'height 0.15s linear',
          }}
        />
      </div>

      {/* Scene dots — 5 scenes */}
      {Array.from({ length: 5 }, (_, i) => {
        const isActive = Math.floor(progress * 5) === i
        return (
          <div
            key={i}
            style={{
              width: isActive ? 4 : 3,
              height: isActive ? 4 : 3,
              borderRadius: '50%',
              background: isActive
                ? 'rgba(244,240,232,0.65)'
                : 'rgba(244,240,232,0.14)',
              transition: 'all 0.5s ease',
            }}
          />
        )
      })}
    </div>
  )
}
