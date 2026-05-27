import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const MARQUEE_TEXT = 'CULTIVATING THE FUTURE • BIO PARK • '

const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'X (Twitter)', href: '#' },
  { label: 'YouTube', href: '#' },
  { label: 'LinkedIn', href: '#' },
]

export default function Footer() {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!marqueeRef.current) return
    const el = marqueeRef.current

    gsap.to(el, {
      x: '-50%',
      duration: 38,
      ease: 'none',
      repeat: -1,
    })

    return () => {
      gsap.killTweensOf(el)
    }
  }, [])

  return (
    <footer style={{ background: '#0B130B', borderTop: '1px solid rgba(141,175,116,0.1)' }}>

      {/* ── Marquee strip ── */}
      <div
        style={{
          overflow: 'hidden',
          borderBottom: '1px solid rgba(141,175,116,0.1)',
          padding: '1.25rem 0',
          background: '#0D160D',
        }}
      >
        <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
          <div
            ref={marqueeRef}
            style={{ display: 'flex', whiteSpace: 'nowrap', willChange: 'transform' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: '0.6875rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#F5F3EC',
                  paddingRight: '4rem',
                  display: 'inline-block',
                }}
              >
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '2.5rem 6%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: logo + copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.8125rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#F5F3EC',
                lineHeight: 1.2,
              }}
            >
              BIO<br />PARK
            </div>
          </div>

          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '0.75rem',
              color: 'rgba(166,176,167,0.6)',
              letterSpacing: '0.04em',
            }}
          >
            © BIO PARK. All rights reserved.
          </span>
        </div>

        {/* Right: social links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {SOCIALS.map(s => (
            <a
              key={s.label}
              href={s.href}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                color: 'rgba(166,176,167,0.7)',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8DAF74')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(166,176,167,0.7)')}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
