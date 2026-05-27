import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const containerRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Dissolve gently as the visitor steps into the conservatory
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -20,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '7% top',
          end: '18% top',
          scrub: 1.5,
        },
      })

      // Entrance sequence — unhurried, breath by breath
      gsap.fromTo('.hero-eyebrow',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 1.6, delay: 0.4, ease: 'power2.out' }
      )
      gsap.fromTo('.hero-wordmark',
        { opacity: 0, y: 28, letterSpacing: '0.25em' },
        { opacity: 1, y: 0, letterSpacing: '0.14em', duration: 2.0, delay: 0.7, ease: 'power3.out' }
      )
      gsap.fromTo('.hero-rule',
        { scaleX: 0 },
        { scaleX: 1, duration: 2.0, delay: 1.2, ease: 'power3.inOut', transformOrigin: 'left' }
      )
      gsap.fromTo('.hero-tagline',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.4, delay: 1.6, ease: 'power2.out' }
      )
      gsap.fromTo('.hero-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 2.6, ease: 'power2.out' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 pointer-events-none"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 9vw 12vh',
      }}
    >
      {/* Eyebrow — very small, very quiet */}
      <div
        className="hero-eyebrow font-body"
        style={{
          fontSize: '0.58rem',
          letterSpacing: '0.38em',
          color: 'rgba(244,240,232,0.38)',
          marginBottom: '1.6rem',
          opacity: 0,
        }}
      >
        GREENHOUSE · FERMENTATION · NATURE · CARE
      </div>

      {/* Primary wordmark */}
      <h1
        className="hero-wordmark font-display"
        style={{
          fontSize: 'clamp(4.2rem, 12vw, 10rem)',
          fontWeight: 400,
          lineHeight: 0.92,
          letterSpacing: '0.14em',
          color: '#f4f0e8',
          marginBottom: '2rem',
          opacity: 0,
        }}
      >
        BIO PARK
      </h1>

      {/* Rule */}
      <div
        className="hero-rule"
        style={{
          height: 1,
          width: 'min(280px, 30vw)',
          background: 'rgba(244,240,232,0.2)',
          marginBottom: '1.8rem',
          opacity: 0.9,
        }}
      />

      {/* Tagline — italic, editorial */}
      <p
        className="hero-tagline font-display"
        style={{
          fontSize: 'clamp(0.9rem, 1.8vw, 1.25rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          color: 'rgba(244,240,232,0.48)',
          letterSpacing: '0.04em',
          maxWidth: 400,
          lineHeight: 1.5,
          opacity: 0,
        }}
      >
        A living sanctuary of extraordinary scale
      </p>

      {/* Scroll indicator */}
      <div
        className="hero-scroll"
        style={{
          position: 'absolute',
          bottom: '4.5vh',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.7rem',
          opacity: 0,
        }}
      >
        <div
          style={{
            width: 1,
            height: 48,
            background: 'rgba(244,240,232,0.15)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '50%',
              background: 'rgba(244,240,232,0.5)',
              animation: 'scrollLine 2.4s ease-in-out infinite',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.3em',
            color: 'rgba(244,240,232,0.25)',
            fontFamily: 'Jost, sans-serif',
          }}
        >
          SCROLL
        </span>
      </div>

      <style>{`
        @keyframes scrollLine {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
