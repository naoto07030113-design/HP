import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const containerRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade out as user scrolls past the entrance
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -30,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '8% top',
          end: '20% top',
          scrub: 1.2,
        },
      })

      // Staggered entrance animations
      gsap.fromTo('.bio-tag',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.4, delay: 0.2, ease: 'power3.out' }
      )
      gsap.fromTo('.bio-title',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 1.6, delay: 0.5, ease: 'power3.out' }
      )
      gsap.fromTo('.bio-subtitle',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.9, ease: 'power3.out' }
      )
      gsap.fromTo('.bio-divider',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 1.8, delay: 0.8, ease: 'power3.inOut' }
      )
      gsap.fromTo('.bio-desc',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.0, delay: 1.3, ease: 'power3.out' }
      )
      gsap.fromTo('.bio-cta',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.0, delay: 1.7, ease: 'power3.out' }
      )
      gsap.fromTo('.bio-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 1.0, delay: 2.4, ease: 'power3.out' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-center"
      style={{ padding: '0 8vw' }}
    >
      {/* Content block */}
      <div style={{ maxWidth: 580 }}>

        {/* Tag line */}
        <div
          className="bio-tag label-tag mb-7 flex items-center gap-3"
          style={{ opacity: 0 }}
        >
          <div style={{ width: 28, height: 1, background: '#6ab850' }} />
          A Living Sanctuary · Nature · Fermentation · Care
        </div>

        {/* Main title */}
        <h1 style={{ marginBottom: '0.3em' }}>
          <div
            className="bio-title font-display text-cream"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: '0.06em',
              opacity: 0,
              color: '#f4f0e8',
            }}
          >
            BIO PARK
          </div>
        </h1>

        {/* Subtitle */}
        <div
          className="bio-subtitle font-display"
          style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.35rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(244,240,232,0.55)',
            letterSpacing: '0.04em',
            marginBottom: '1.8rem',
            opacity: 0,
          }}
        >
          A Monumental Greenhouse of Growth
        </div>

        {/* Divider */}
        <div
          className="bio-divider"
          style={{
            height: 1,
            width: 220,
            background: 'linear-gradient(90deg, rgba(106,184,80,0.7), rgba(138,184,128,0.3), transparent)',
            marginBottom: '1.8rem',
            opacity: 0,
          }}
        />

        {/* Description */}
        <p
          className="bio-desc font-body"
          style={{
            fontSize: 'clamp(0.78rem, 1.4vw, 0.92rem)',
            fontWeight: 300,
            lineHeight: 1.85,
            color: 'rgba(244,240,232,0.42)',
            maxWidth: 440,
            marginBottom: '2.4rem',
            opacity: 0,
            letterSpacing: '0.03em',
          }}
        >
          Step inside a breathtaking botanical conservatory — where natural
          light filters through glass and steel, and life grows in
          extraordinary abundance.
        </p>

        {/* CTA */}
        <div
          className="bio-cta flex items-center gap-5 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <button
            className="btn-primary"
            onClick={() => {
              const el = document.getElementById('grand-hall')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Enter the Greenhouse
          </button>
          <span
            className="font-body"
            style={{ fontSize: '0.68rem', color: 'rgba(244,240,232,0.25)', letterSpacing: '0.15em' }}
          >
            Scroll to explore ↓
          </span>
        </div>
      </div>

      {/* Scroll indicator — bottom center */}
      <div
        className="bio-scroll absolute bottom-9 left-1/2 flex flex-col items-center gap-2"
        style={{ transform: 'translateX(-50%)', opacity: 0 }}
      >
        <span
          className="label-tag"
          style={{ fontSize: '0.52rem', color: 'rgba(138,184,128,0.5)' }}
        >
          Scroll
        </span>
        <div style={{ width: 1, height: 42, background: 'rgba(106,184,80,0.2)', overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '45%',
              background: 'linear-gradient(180deg, #6ab850, transparent)',
              animation: 'scrollDrop 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(240%); }
        }
      `}</style>
    </div>
  )
}
