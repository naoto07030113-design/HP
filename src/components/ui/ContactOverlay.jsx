import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ContactOverlay({ onOpenSubscription }) {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 45 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: '84% top',
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
        background: 'linear-gradient(180deg, transparent 0%, rgba(26,46,24,0.78) 25%, rgba(15,28,14,0.88) 100%)',
        opacity: 0,
      }}
    >
      <div className="pointer-events-auto text-center" style={{ maxWidth: 560, padding: '0 2rem' }}>

        {/* Tag */}
        <div className="label-tag mb-7" style={{ color: '#8ab880' }}>
          Discover BIO PARK
        </div>

        {/* Main heading */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2.2rem, 6vw, 5rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            color: '#f4f0e8',
            marginBottom: '0.25em',
            letterSpacing: '0.04em',
          }}
        >
          A Living Sanctuary
        </h2>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(1.0rem, 2.5vw, 2rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(138,184,128,0.75)',
            marginBottom: '2.2rem',
            letterSpacing: '0.05em',
          }}
        >
          of Growth, Fermentation and Care
        </h2>

        {/* Divider */}
        <div className="divider-botanical mb-8" style={{ width: 200, margin: '0 auto 2rem' }} />

        {/* Description */}
        <p
          className="font-body"
          style={{
            fontSize: '0.85rem',
            fontWeight: 300,
            lineHeight: 1.85,
            color: 'rgba(244,240,232,0.38)',
            marginBottom: '2.8rem',
            letterSpacing: '0.02em',
          }}
        >
          BIO PARK is more than a greenhouse — it is an immersive philosophy.
          Where ancient plants meet purposeful cultivation, where nature and
          human care grow together in a grand glass cathedral.
        </p>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <button className="btn-primary" onClick={onOpenSubscription}>
            Support the Vision
          </button>
          <button className="btn-secondary">
            Contact Us →
          </button>
        </div>

        {/* Info row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            borderTop: '1px solid rgba(106,184,80,0.12)',
            paddingTop: '1.8rem',
          }}
        >
          {[
            { tag: 'Location',  value: 'Japan' },
            { tag: 'Hours',     value: '9:00–18:00' },
            { tag: 'Inquiry',   value: 'Open Now' },
          ].map((item) => (
            <div key={item.tag} className="text-center">
              <div className="label-tag mb-1" style={{ fontSize: '0.52rem', color: '#8ab880' }}>
                {item.tag}
              </div>
              <div
                className="font-body"
                style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(244,240,232,0.5)', letterSpacing: '0.08em' }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom mark */}
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="divider-botanical" style={{ width: 50, margin: '0 auto' }} />
          <div
            className="font-display"
            style={{ fontSize: '0.65rem', letterSpacing: '0.35em', color: 'rgba(244,240,232,0.15)' }}
          >
            BIO PARK · Greenhouse & Nature
          </div>
          <div className="label-tag" style={{ fontSize: '0.48rem', color: 'rgba(244,240,232,0.1)' }}>
            © 2025 All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  )
}
