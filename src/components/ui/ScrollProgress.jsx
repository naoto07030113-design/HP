import { useEffect, useState } from 'react'

const scenes = [
  { label: 'Entrance',    id: 0 },
  { label: 'Grand Hall',  id: 1 },
  { label: 'Living Path', id: 2 },
  { label: 'Cultivation', id: 3 },
  { label: 'Reflection',  id: 4 },
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

  // Which of the 5 scenes is currently active
  const activeScene = Math.min(Math.floor(progress * 5), 4)

  return (
    <div
      className="fixed right-5 top-1/2 z-30 flex flex-col items-center gap-4"
      style={{ transform: 'translateY(-50%)', pointerEvents: 'none' }}
    >
      {/* Vertical progress track */}
      <div
        style={{
          position: 'relative',
          width: 1,
          height: 130,
          background: 'rgba(244,240,232,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${progress * 100}%`,
            background: 'linear-gradient(180deg, #4a8c3f, #8ab880)',
            transition: 'height 0.1s linear',
          }}
        />
      </div>

      {/* Scene dots */}
      {scenes.map((scene) => (
        <div key={scene.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width:  activeScene === scene.id ? 6 : 4,
              height: activeScene === scene.id ? 6 : 4,
              borderRadius: '50%',
              background: activeScene === scene.id
                ? '#6ab850'
                : 'rgba(244,240,232,0.18)',
              boxShadow: activeScene === scene.id
                ? '0 0 8px rgba(106,184,80,0.7)'
                : 'none',
              transition: 'all 0.5s ease',
            }}
          />
          <span
            className="font-body hidden lg:block"
            style={{
              fontSize: '0.52rem',
              letterSpacing: '0.1em',
              color: activeScene === scene.id
                ? 'rgba(138,184,128,0.75)'
                : 'rgba(244,240,232,0.15)',
              transition: 'color 0.5s ease',
            }}
          >
            {scene.label}
          </span>
        </div>
      ))}

      {/* Progress percentage */}
      <div
        className="font-body"
        style={{
          fontSize: '0.5rem',
          letterSpacing: '0.1em',
          color: 'rgba(244,240,232,0.15)',
          marginTop: 4,
        }}
      >
        {Math.round(progress * 100)}%
      </div>
    </div>
  )
}
