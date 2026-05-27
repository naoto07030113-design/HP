import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const scenes = [
  {
    id: 'grand-hall',
    number: '02',
    tag: 'Grand Central Conservatory',
    title: 'The Living Cathedral',
    description: 'Monumental glass and steel rise into the morning sky. Sunlight breaks through and touches the earth in gold.',
    triggerStart: '14%',
    triggerEnd: '32%',
    side: 'left',
  },
  {
    id: 'living-path',
    number: '03',
    tag: 'The Living Path',
    title: 'Deep in Green',
    description: 'A dense corridor of botanical abundance. Humidity hangs in the air. Light moves through leaves.',
    triggerStart: '36%',
    triggerEnd: '54%',
    side: 'right',
  },
  {
    id: 'cultivation',
    number: '04',
    tag: 'Cultivation & Harvest',
    title: 'Where Life Grows',
    description: 'Asparagus, lettuce, herbs. Raised beds and hydroponic racks. Purposeful, productive, elegant.',
    triggerStart: '56%',
    triggerEnd: '74%',
    side: 'left',
  },
  {
    id: 'reflection',
    number: '05',
    tag: 'The Reflection Hall',
    title: 'Stillness at the End',
    description: 'A serene, open hall. A mirror pool. The greenhouse breathes around you in quiet luxury.',
    triggerStart: '76%',
    triggerEnd: '96%',
    side: 'right',
  },
]

function SceneLabel({ scene }) {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: scene.side === 'left' ? -35 : 35 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
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
  }, [scene])

  const isLeft = scene.side === 'left'

  return (
    <div
      ref={ref}
      className="fixed z-30 pointer-events-none"
      style={{
        opacity: 0,
        bottom: '10vh',
        ...(isLeft ? { left: '4vw' } : { right: '4vw' }),
        maxWidth: 340,
      }}
    >
      {/* Large ghost number */}
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(4.5rem, 10vw, 7.5rem)',
          fontWeight: 300,
          lineHeight: 0.9,
          color: 'rgba(244,240,232,0.04)',
          marginBottom: '0.1em',
          letterSpacing: '-0.02em',
        }}
      >
        {scene.number}
      </div>

      {/* Tag */}
      <div className="label-tag mb-2" style={{ color: '#8ab880' }}>
        {scene.tag}
      </div>

      {/* Title */}
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.75rem)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'rgba(244,240,232,0.82)',
          lineHeight: 1.2,
          marginBottom: '0.75rem',
          letterSpacing: '0.02em',
        }}
      >
        {scene.title}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          width: 50,
          background: 'rgba(106,184,80,0.5)',
          marginBottom: '0.85rem',
        }}
      />

      {/* Description */}
      <p
        className="font-body"
        style={{
          fontSize: '0.78rem',
          fontWeight: 300,
          lineHeight: 1.75,
          color: 'rgba(244,240,232,0.38)',
          letterSpacing: '0.025em',
        }}
      >
        {scene.description}
      </p>
    </div>
  )
}

export default function SectionLabels() {
  return (
    <>
      {scenes.map((s) => (
        <SceneLabel key={s.id} scene={s} />
      ))}
    </>
  )
}
