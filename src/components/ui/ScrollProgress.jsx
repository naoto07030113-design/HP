import { useEffect, useState } from 'react'

const zones = [
  { label: '鍼灸', id: 0 },
  { label: 'リハビリ', id: 1 },
  { label: 'ケア', id: 2 },
  { label: 'BIO', id: 3 },
]

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

  const activeZone = Math.floor(progress * 4)

  return (
    <div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-5"
      style={{ pointerEvents: 'none' }}
    >
      {/* Vertical progress line */}
      <div className="relative w-px h-40" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="absolute top-0 left-0 w-full transition-all duration-100"
          style={{
            height: `${progress * 100}%`,
            background: 'linear-gradient(180deg, #c9a84c, #52b788)',
            boxShadow: '0 0 8px rgba(82,183,136,0.6)',
          }}
        />
      </div>

      {/* Zone dots */}
      {zones.map((z) => (
        <div key={z.id} className="flex items-center gap-2">
          <div
            className="transition-all duration-500"
            style={{
              width: activeZone === z.id ? '6px' : '4px',
              height: activeZone === z.id ? '6px' : '4px',
              borderRadius: '50%',
              background: activeZone === z.id ? '#c9a84c' : 'rgba(255,255,255,0.2)',
              boxShadow: activeZone === z.id ? '0 0 10px rgba(201,168,76,0.8)' : 'none',
            }}
          />
          <span
            className="jp-text transition-all duration-500 hidden lg:block"
            style={{
              fontSize: '0.55rem',
              color: activeZone === z.id ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.2)',
              letterSpacing: '0.1em',
            }}
          >
            {z.label}
          </span>
        </div>
      ))}

      {/* Progress number */}
      <div className="label-tag" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
        {Math.round(progress * 100)}%
      </div>
    </div>
  )
}
