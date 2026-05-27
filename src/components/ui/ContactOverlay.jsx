import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ContactOverlay() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: '83% top',
            end:   '100% top',
            toggleActions: 'play none none reverse',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(18,32,16,0.72) 22%, rgba(12,22,10,0.85) 100%)',
        opacity: 0,
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          textAlign: 'center',
          maxWidth: 480,
          padding: '0 3rem',
        }}
      >
        {/* Small eyebrow */}
        <div
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.55rem',
            letterSpacing: '0.38em',
            color: 'rgba(138,184,128,0.6)',
            marginBottom: '2.8rem',
          }}
        >
          DISCOVER BIO PARK
        </div>

        {/* Headline — spare and vast */}
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2.4rem, 6vw, 5rem)',
            fontWeight: 400,
            lineHeight: 1.0,
            letterSpacing: '0.06em',
            color: '#f4f0e8',
            marginBottom: '0.35em',
          }}
        >
          A Living
        </h2>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2.4rem, 6vw, 5rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.0,
            letterSpacing: '0.04em',
            color: 'rgba(138,184,128,0.72)',
            marginBottom: '3.5rem',
          }}
        >
          Sanctuary
        </h2>

        {/* Thin rule */}
        <div
          style={{
            height: 1,
            width: 48,
            background: 'rgba(244,240,232,0.18)',
            margin: '0 auto 3rem',
          }}
        />

        {/* One quiet line of copy */}
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 300,
            lineHeight: 1.9,
            letterSpacing: '0.04em',
            color: 'rgba(244,240,232,0.32)',
            marginBottom: '3.5rem',
            maxWidth: 360,
            margin: '0 auto 3.5rem',
          }}
        >
          Step inside. Breathe. Feel the light move through glass and green.
          BIO PARK exists to remind you that nature is the grandest luxury.
        </p>

        {/* Two CTAs — one primary, one ghost */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
          <button
            style={{
              background: 'rgba(244,240,232,0.08)',
              border: '1px solid rgba(244,240,232,0.28)',
              color: '#f4f0e8',
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 300,
              letterSpacing: '0.28em',
              padding: '1.1rem 3.2rem',
              cursor: 'pointer',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,240,232,0.16)'
              e.currentTarget.style.borderColor = 'rgba(244,240,232,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(244,240,232,0.08)'
              e.currentTarget.style.borderColor = 'rgba(244,240,232,0.28)'
            }}
          >
            SUPPORT THE VISION
          </button>

          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(244,240,232,0.28)',
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.62rem',
              fontWeight: 300,
              letterSpacing: '0.22em',
              cursor: 'pointer',
              padding: '0.4rem 0',
              transition: 'color 0.4s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(244,240,232,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,240,232,0.28)'}
          >
            CONTACT US →
          </button>
        </div>

        {/* Bottom signature */}
        <div
          style={{
            marginTop: '5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
          }}
        >
          <div
            style={{
              width: 28,
              height: 1,
              background: 'rgba(244,240,232,0.1)',
            }}
          />
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '0.58rem',
              letterSpacing: '0.4em',
              color: 'rgba(244,240,232,0.12)',
            }}
          >
            BIO PARK · 2025
          </div>
        </div>
      </div>
    </div>
  )
}
