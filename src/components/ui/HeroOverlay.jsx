import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const containerRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -18,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '7% top',
          end: '18% top',
          scrub: 1.5,
        },
      })

      gsap.fromTo('.hero-eyebrow',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 1.6, delay: 0.4, ease: 'power2.out' }
      )
      gsap.fromTo('.hero-wordmark',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 2.0, delay: 0.7, ease: 'power3.out' }
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'clamp(1.5rem, 5vw, 4rem) clamp(1.5rem, 7vw, 5rem) clamp(10vh, 14vh, 100px)',
        boxSizing: 'border-box',
        /* Prevent horizontal overflow on mobile */
        overflow: 'hidden',
        maxWidth: '100vw',
      }}
    >
      {/* Eyebrow */}
      <div
        className="hero-eyebrow"
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(0.48rem, 1.5vw, 0.58rem)',
          letterSpacing: '0.30em',
          color: 'rgba(244,240,232,0.38)',
          marginBottom: 'clamp(1rem, 2.5vh, 1.6rem)',
          opacity: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        GREENHOUSE · FERMENTATION · NATURE · CARE
      </div>

      {/* Primary wordmark */}
      <h1
        className="hero-wordmark"
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(3.2rem, 13vw, 10rem)',
          fontWeight: 400,
          lineHeight: 0.92,
          letterSpacing: '0.10em',
          color: '#f4f0e8',
          marginBottom: 'clamp(1.2rem, 3vw, 2rem)',
          opacity: 0,
          /* Prevent overflow on narrow screens */
          maxWidth: '100%',
        }}
      >
        BIO PARK
      </h1>

      {/* Rule */}
      <div
        className="hero-rule"
        style={{
          height: 1,
          width: 'clamp(120px, 25vw, 280px)',
          background: 'rgba(244,240,232,0.2)',
          marginBottom: 'clamp(1rem, 2.5vw, 1.8rem)',
        }}
      />

      {/* Tagline */}
      <p
        className="hero-tagline"
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(0.8rem, 2.5vw, 1.25rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          color: 'rgba(244,240,232,0.48)',
          letterSpacing: '0.04em',
          maxWidth: 'min(400px, 85vw)',
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
          bottom: 'clamp(2.5rem, 5vh, 4rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          opacity: 0,
        }}
      >
        <div
          style={{
            width: 1,
            height: 44,
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
            fontSize: '0.48rem',
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
