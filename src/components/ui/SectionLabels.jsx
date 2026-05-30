import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const scenes = [
  {
    id: 'entrance',
    number: '01',
    tag: 'La Terrazza',
    title: 'Under the Lemon Sky',
    description: 'Stone, bougainvillea, and the scent of the sea. A terrace that exists between the world and somewhere more beautiful.',
    triggerStart: '8%',
    triggerEnd: '24%',
    side: 'right',
  },
  {
    id: 'dining',
    number: '02',
    tag: 'Il Ristorante',
    title: 'Where Families Gather',
    description: 'White linen, candlelit tables, and the murmur of Italian conversation. The heart of La Costa.',
    triggerStart: '28%',
    triggerEnd: '50%',
    side: 'left',
  },
  {
    id: 'cantina',
    number: '03',
    tag: 'La Cantina',
    title: 'A Century of Tradition',
    description: 'Stone-walled passages lit by iron lanterns. Every bottle tells a story from somewhere south of Naples.',
    triggerStart: '54%',
    triggerEnd: '74%',
    side: 'right',
  },
  {
    id: 'contact',
    number: '04',
    tag: 'La Sala Privata',
    title: 'Your Own Corner',
    description: 'For evenings that deserve to be unforgettable. Reserve the private room for occasions that matter.',
    triggerStart: '77%',
    triggerEnd: '96%',
    side: 'left',
  },
]

function SceneLabel({ scene }) {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: scene.side === 'left' ? -30 : 30 },
        {
          opacity: 1,
          x: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: `${scene.triggerStart} top`,
            end: `${scene.triggerEnd} top`,
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
        maxWidth: 320,
      }}
    >
      {/* Ghost number */}
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(5rem, 11vw, 8rem)',
          fontWeight: 300,
          lineHeight: 0.88,
          color: 'rgba(193,150,80,0.05)',
          marginBottom: '0.05em',
          letterSpacing: '-0.02em',
        }}
      >
        {scene.number}
      </div>

      {/* Tag */}
      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.58rem',
          fontWeight: 300,
          letterSpacing: '0.34em',
          color: 'rgba(193,150,80,0.6)',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}
      >
        {scene.tag}
      </div>

      {/* Title */}
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(1.2rem, 2.4vw, 1.85rem)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'rgba(240,220,180,0.85)',
          lineHeight: 1.15,
          marginBottom: '0.75rem',
          letterSpacing: '0.015em',
        }}
      >
        {scene.title}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          width: 44,
          background: 'rgba(193,150,80,0.45)',
          marginBottom: '0.8rem',
        }}
      />

      {/* Description */}
      <p
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.78rem',
          fontWeight: 300,
          lineHeight: 1.8,
          color: 'rgba(240,220,180,0.35)',
          letterSpacing: '0.02em',
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
