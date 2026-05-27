import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Minimal editorial labels — barely there, just enough orientation
const scenes = [
  {
    number:  '02',
    title:   'Grand Central Conservatory',
    triggerStart: '14%',
    triggerEnd:   '33%',
    align: 'left',
  },
  {
    number:  '03',
    title:   'The Living Path',
    triggerStart: '36%',
    triggerEnd:   '55%',
    align: 'right',
  },
  {
    number:  '04',
    title:   'Cultivation & Harvest',
    triggerStart: '58%',
    triggerEnd:   '75%',
    align: 'left',
  },
  {
    number:  '05',
    title:   'Reflection Hall',
    triggerStart: '77%',
    triggerEnd:   '96%',
    align: 'right',
  },
]

function SceneLabel({ scene }) {
  const ref = useRef()
  const isLeft = scene.align === 'left'

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: isLeft ? -20 : 20 },
        {
          opacity: 1,
          x: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: `${scene.triggerStart} top`,
            end:   `${scene.triggerEnd} top`,
            toggleActions: 'play reverse play reverse',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [scene, isLeft])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: '8vh',
        ...(isLeft ? { left: '4.5vw' } : { right: '4.5vw' }),
        zIndex: 30,
        pointerEvents: 'none',
        opacity: 0,
        maxWidth: 260,
      }}
    >
      {/* Ghost number — very faint, large */}
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(3.5rem, 8vw, 6rem)',
          fontWeight: 300,
          lineHeight: 0.88,
          color: 'rgba(244,240,232,0.04)',
          letterSpacing: '-0.02em',
          marginBottom: '0.4rem',
          userSelect: 'none',
        }}
      >
        {scene.number}
      </div>

      {/* Title — single line, quiet */}
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(0.85rem, 1.6vw, 1.15rem)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'rgba(244,240,232,0.55)',
          letterSpacing: '0.03em',
          lineHeight: 1.3,
        }}
      >
        {scene.title}
      </div>
    </div>
  )
}

export default function SectionLabels() {
  return (
    <>
      {scenes.map((s) => (
        <SceneLabel key={s.number} scene={s} />
      ))}
    </>
  )
}
