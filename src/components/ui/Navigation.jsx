import { useEffect, useState } from 'react'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 50)
      setHidden(y > lastY + 10 && y > 200 && !menuOpen)
      setLastY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY, menuOpen])

  const navItems = [
    { label: 'Entrance',    id: 'entrance'    },
    { label: 'Grand Hall',  id: 'grand-hall'  },
    { label: 'Living Path', id: 'living-path' },
    { label: 'Cultivation', id: 'cultivation' },
    { label: 'Reflection',  id: 'reflection'  },
  ]

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(1rem, 2.5vw, 1.6rem) clamp(1.2rem, 4vw, 3.5rem)',
          background: scrolled
            ? 'rgba(18, 30, 16, 0.80)'
            : 'linear-gradient(180deg, rgba(16,28,14,0.75) 0%, transparent 100%)',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(244,240,232,0.06)' : 'none',
          opacity: hidden ? 0 : 1,
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.6s ease',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '60% 60% 60% 0',
              background: 'rgba(138,184,128,0.55)',
              transform: 'rotate(-45deg)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(0.85rem, 2.5vw, 1.02rem)',
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: 'rgba(244,240,232,0.88)',
              whiteSpace: 'nowrap',
            }}
          >
            BIO PARK
          </span>
        </div>

        {/* Desktop nav links */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(1.5rem, 3vw, 3rem)',
          }}
          className="hidden md:flex"
        >
          {navItems.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.60rem',
                fontWeight: 300,
                letterSpacing: '0.18em',
                color: 'rgba(244,240,232,0.38)',
                transition: 'color 0.35s ease',
                padding: '0.2rem 0',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(244,240,232,0.75)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,240,232,0.38)'}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          onClick={() => scrollTo('reflection')}
          className="hidden md:block"
          style={{
            background: 'none',
            border: '1px solid rgba(244,240,232,0.22)',
            color: 'rgba(244,240,232,0.55)',
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.58rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            padding: '0.55rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(244,240,232,0.45)'
            e.currentTarget.style.color = 'rgba(244,240,232,0.85)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(244,240,232,0.22)'
            e.currentTarget.style.color = 'rgba(244,240,232,0.55)'
          }}
        >
          CONTACT
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
          aria-label="Menu"
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 22,
                height: 1,
                background: 'rgba(244,240,232,0.65)',
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                transformOrigin: 'center',
                transform: menuOpen
                  ? i === 0 ? 'translateY(6px) rotate(45deg)'
                  : i === 2 ? 'translateY(-6px) rotate(-45deg)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </nav>

      {/* Mobile drawer menu */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 40,
          background: 'rgba(12, 22, 10, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.2rem',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 0.4s ease',
        }}
      >
        {navItems.map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '0.06em',
              color: 'rgba(244,240,232,0.72)',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f4f0e8'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,240,232,0.72)'}
          >
            {label}
          </button>
        ))}

        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => scrollTo('reflection')}
            style={{
              background: 'none',
              border: '1px solid rgba(244,240,232,0.28)',
              color: 'rgba(244,240,232,0.55)',
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 300,
              letterSpacing: '0.28em',
              padding: '0.85rem 2.5rem',
              cursor: 'pointer',
            }}
          >
            CONTACT
          </button>
        </div>
      </div>
    </>
  )
}
