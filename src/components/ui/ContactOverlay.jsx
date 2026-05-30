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
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: '82% top',
            end: '100% top',
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
      className="fixed inset-0 z-20 pointer-events-none flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(13,6,2,0.75) 22%, rgba(8,4,1,0.92) 100%)',
        opacity: 0,
      }}
    >
      <div className="pointer-events-auto text-center" style={{ maxWidth: 540, padding: '0 2rem' }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.58rem',
            fontWeight: 300,
            letterSpacing: '0.36em',
            color: 'rgba(193,150,80,0.6)',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}
        >
          La Sala Privata
        </div>

        {/* Main heading */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 5.2rem)',
            fontWeight: 400,
            lineHeight: 1.0,
            color: '#f0e6d3',
            marginBottom: '0.2em',
            letterSpacing: '0.03em',
          }}
        >
          Riservate una Serata
        </h2>
        <h3
          className="font-display"
          style={{
            fontSize: 'clamp(1.0rem, 2.2vw, 1.8rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(193,150,80,0.65)',
            marginBottom: '2rem',
            letterSpacing: '0.04em',
          }}
        >
          indimenticabile
        </h3>

        {/* Divider */}
        <div
          className="divider-gold"
          style={{ width: 180, margin: '0 auto 2rem' }}
        />

        {/* Description */}
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.86rem',
            fontWeight: 300,
            lineHeight: 1.9,
            color: 'rgba(240,220,180,0.35)',
            marginBottom: '2.8rem',
            letterSpacing: '0.02em',
          }}
        >
          From our private sala to the terrace at sunset — Trattoria La Costa
          has welcomed guests for over sixty years. Let us create something
          extraordinary for you and your guests.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="btn-primary">
            Prenota la Tua Tavola
          </button>
          <button
            className="btn-ghost"
            onClick={() => alert('info@trattorialacosta.it')}
          >
            Scrivici →
          </button>
        </div>

        {/* Info row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            borderTop: '1px solid rgba(193,150,80,0.1)',
            paddingTop: '1.8rem',
          }}
        >
          {[
            { tag: 'Indirizzo', value: 'Via Marina, Positano' },
            { tag: 'Orario',    value: '12:00 – 23:00' },
            { tag: 'Telefono',  value: '+39 089 875 123' },
          ].map((item) => (
            <div key={item.tag} className="text-center">
              <div
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.52rem',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: 'rgba(193,150,80,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                {item.tag}
              </div>
              <div
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 300,
                  color: 'rgba(240,220,180,0.45)',
                  letterSpacing: '0.06em',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer mark */}
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="divider-gold" style={{ width: 44, margin: '0 auto' }} />
          <div
            className="font-display"
            style={{ fontSize: '0.62rem', letterSpacing: '0.38em', color: 'rgba(240,220,180,0.15)' }}
          >
            TRATTORIA LA COSTA
          </div>
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.48rem',
              letterSpacing: '0.18em',
              color: 'rgba(240,220,180,0.1)',
            }}
          >
            © 2025 · All Rights Reserved · Positano, Italy
          </div>
        </div>
      </div>
    </div>
  )
}
