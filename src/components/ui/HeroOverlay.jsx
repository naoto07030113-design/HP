import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const containerRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade out as user scrolls into the restaurant
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -28,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '6% top',
          end: '18% top',
          scrub: 1.5,
        },
      })

      // Staggered entrance
      gsap.fromTo('.hero-eyebrow',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.6, delay: 0.3, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-title-line1',
        { opacity: 0, y: 42 },
        { opacity: 1, y: 0, duration: 1.8, delay: 0.55, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-title-line2',
        { opacity: 0, y: 42 },
        { opacity: 1, y: 0, duration: 1.8, delay: 0.72, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-divider',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 2.2, delay: 0.9, ease: 'power3.inOut' }
      )
      gsap.fromTo('.hero-desc',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.2, delay: 1.4, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-cta',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.0, delay: 1.9, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 2.8, ease: 'power3.out' }
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
      <div style={{ maxWidth: 600 }}>
        {/* Eyebrow */}
        <div
          className="hero-eyebrow flex items-center gap-3 mb-8"
          style={{ opacity: 0 }}
        >
          <div style={{ width: 34, height: 1, background: 'rgba(193,150,80,0.6)' }} />
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 300,
              letterSpacing: '0.34em',
              color: 'rgba(193,150,80,0.65)',
              textTransform: 'uppercase',
            }}
          >
            Cucina Meridionale · Amalfi Coast
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{ marginBottom: '0.2em' }}>
          <div
            className="hero-title-line1 font-display"
            style={{
              fontSize: 'clamp(3.8rem, 9.5vw, 8.5rem)',
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: '0.04em',
              color: '#f0e6d3',
              opacity: 0,
            }}
          >
            Trattoria
          </div>
          <div
            className="hero-title-line2 font-display"
            style={{
              fontSize: 'clamp(3.8rem, 9.5vw, 8.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.92,
              letterSpacing: '0.04em',
              color: 'rgba(240,220,160,0.88)',
              opacity: 0,
            }}
          >
            La Costa
          </div>
        </h1>

        {/* Divider */}
        <div
          className="hero-divider"
          style={{
            height: 1,
            width: 260,
            marginTop: '1.8rem',
            marginBottom: '1.8rem',
            background: 'linear-gradient(90deg, rgba(193,150,80,0.65), rgba(193,150,80,0.2), transparent)',
          }}
        />

        {/* Description */}
        <p
          className="hero-desc"
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 'clamp(0.8rem, 1.35vw, 0.95rem)',
            fontWeight: 300,
            lineHeight: 1.9,
            color: 'rgba(240,220,180,0.38)',
            maxWidth: 420,
            marginBottom: '2.6rem',
            opacity: 0,
            letterSpacing: '0.025em',
          }}
        >
          Where sun-warmed stone meets the scent of sea salt and lemon —
          step inside our family trattoria on the Amalfi Coast.
        </p>

        {/* CTAs */}
        <div
          className="hero-cta flex items-center gap-6 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <button
            className="btn-primary"
            onClick={() => {
              document.getElementById('dining')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Entra
          </button>
          <button
            className="btn-ghost"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          >
            Prenota
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hero-scroll absolute"
        style={{
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.52rem',
            letterSpacing: '0.3em',
            color: 'rgba(193,150,80,0.4)',
          }}
        >
          SCORRI
        </span>
        <div
          style={{
            width: 1,
            height: 44,
            background: 'rgba(193,150,80,0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '50%',
              background: 'linear-gradient(180deg, rgba(193,150,80,0.7), transparent)',
              animation: 'scrollDrop 2.2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(230%); }
        }
      `}</style>
    </div>
  )
}
