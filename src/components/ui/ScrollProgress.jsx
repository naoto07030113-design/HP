import { useEffect, useState } from 'react'

const zones = [
  { label: '本院', id: 0 },
  { label: 'ストレッチ', id: 1 },
  { label: 'SANRI', id: 2 },
  { label: 'リハビリ', id: 3 },
]

export default function ScrollProgress({ scrollRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf
    const update = () => { setProgress(scrollRef.current); raf = requestAnimationFrame(update) }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef])

  const activeZone = Math.min(Math.floor(progress * 4.5), 3)

  return (
    <div
      className="fixed right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-4"
      style={{ pointerEvents: 'none' }}
    >
      {/* Progress line */}
      <div className="relative w-0.5 h-32" style={{ background: '#E0E8D8' }}>
        <div
          style={{
            height: `${progress * 100}%`,
            width: '100%',
            background: '#6AB628',
            transition: 'height 0.1s',
          }}
        />
      </div>

      {/* Zone dots */}
      {zones.map((z) => (
        <div key={z.id} className="flex items-center gap-2">
          <span
            className="jp-text transition-all duration-500 hidden lg:block"
            style={{
              fontSize: '0.6rem',
              color: activeZone === z.id ? '#6AB628' : '#B0B8A8',
              fontWeight: activeZone === z.id ? 600 : 400,
            }}
          >
            {z.label}
          </span>
          <div
            style={{
              width: activeZone === z.id ? '8px' : '5px',
              height: activeZone === z.id ? '8px' : '5px',
              borderRadius: '50%',
              background: activeZone === z.id ? '#6AB628' : '#D0D8C8',
              boxShadow: activeZone === z.id ? '0 0 8px rgba(106,182,40,0.6)' : 'none',
              transition: 'all 0.4s',
            }}
          />
        </div>
      ))}
    </div>
  )
}
