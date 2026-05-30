import { useEffect, useState } from 'react'

const scenes = [
  { label: 'Terrazza',   id: 0 },
  { label: 'Ristorante', id: 1 },
  { label: 'Cantina',    id: 2 },
  { label: 'Privata',    id: 3 },
]

export default function ScrollProgress({ scrollRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf
    const update = () => {
      setProgress(scrollRef.current ?? 0)
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef])

  const activeScene = Math.min(Math.floor(progress * 4), 3)

  return (
    <div
      className="fixed right-5 top-1/2 z-30 flex flex-col items-center gap-4"
      style={{ transform: 'translateY(-50%)', pointerEvents: 'none' }}
    >
      {/* Vertical track */}
      <div style={{ position: 'relative', width: 1, height: 120, background: 'rgba(193,150,80,0.08)' }}>
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: `${progress * 100}%`,
            background: 'linear-gradient(180deg, #8b5a2b, #c17842)',
            transition: 'height 0.12s linear',
          }}
        />
      </div>

      {/* Scene dots */}
      {scenes.map((scene) => (
        <div key={scene.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: activeScene === scene.id ? 6 : 3.5,
              height: activeScene === scene.id ? 6 : 3.5,
              borderRadius: '50%',
              background: activeScene === scene.id ? '#c17842' : 'rgba(193,150,80,0.2)',
              boxShadow: activeScene === scene.id ? '0 0 10px rgba(193,120,66,0.7)' : 'none',
              transition: 'all 0.5s ease',
            }}
          />
          <span
            className="hidden lg:block"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.5rem',
              letterSpacing: '0.1em',
              color: activeScene === scene.id ? 'rgba(193,150,80,0.7)' : 'rgba(240,220,180,0.15)',
              transition: 'color 0.5s ease',
            }}
          >
            {scene.label}
          </span>
        </div>
      ))}

      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.48rem',
          letterSpacing: '0.1em',
          color: 'rgba(193,150,80,0.25)',
          marginTop: 2,
        }}
      >
        {Math.round(progress * 100)}%
      </div>
    </div>
  )
}
