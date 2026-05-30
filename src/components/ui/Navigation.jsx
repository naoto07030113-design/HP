import { useEffect, useState } from 'react'

const navItems = [
  { label: 'Terrazza',    href: '#entrance'     },
  { label: 'Il Ristorante', href: '#dining'      },
  { label: 'La Cantina',  href: '#cantina'       },
  { label: 'Menu',        href: '#menu'          },
  { label: 'Contatti',    href: '#contact'       },
]

export default function Navigation() {
  const [visible, setVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setAtTop(current < 60)
      setVisible(current < lastScroll || current < 80)
      setLastScroll(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScroll])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        padding: '1.5rem 3rem',
        background: atTop
          ? 'linear-gradient(180deg, rgba(13,6,2,0.9) 0%, transparent 100%)'
          : 'rgba(13,6,2,0.72)',
        backdropFilter: atTop ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: atTop ? 'none' : 'blur(20px)',
        borderBottom: atTop ? 'none' : '1px solid rgba(193,120,66,0.12)',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -14}px)`,
        transition: 'opacity 0.7s ease, transform 0.7s ease, background 0.6s ease',
      }}
    >
      {/* Wordmark */}
      <div>
        <div
          className="font-display"
          style={{
            fontSize: '1.1rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            color: '#f0e6d3',
            lineHeight: 1,
          }}
        >
          TRATTORIA
        </div>
        <div
          style={{
            fontSize: '0.52rem',
            letterSpacing: '0.38em',
            color: 'rgba(193,150,80,0.65)',
            marginTop: '2px',
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
          }}
        >
          LA COSTA · AMALFI
        </div>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault()
              const el = document.querySelector(item.href)
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 300,
              letterSpacing: '0.18em',
              color: 'rgba(240,220,180,0.42)',
              transition: 'color 0.4s ease',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.target.style.color = 'rgba(240,220,180,0.85)')}
            onMouseLeave={e => (e.target.style.color = 'rgba(240,220,180,0.42)')}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Reservation CTA */}
      <button
        className="btn-primary"
        style={{ padding: '0.6rem 1.6rem', fontSize: '0.62rem' }}
        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
      >
        Prenota
      </button>
    </nav>
  )
}
