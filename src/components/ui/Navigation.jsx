import { useEffect, useState } from 'react'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 50)
      setHidden(y > lastY + 10 && y > 200)
      setLastY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.6rem 3.5rem',
        background: scrolled
          ? 'rgba(22, 38, 20, 0.72)'
          : 'linear-gradient(180deg, rgba(20,34,18,0.7) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(244,240,232,0.06)' : 'none',
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.6s ease, backdrop-filter 0.4s ease',
      }}
    >
      {/* Logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '60% 60% 60% 0',
            background: 'rgba(138,184,128,0.55)',
            transform: 'rotate(-45deg)',
          }}
        />
        <span
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.02rem',
            fontWeight: 400,
            letterSpacing: '0.20em',
            color: 'rgba(244,240,232,0.88)',
          }}
        >
          BIO PARK
        </span>
      </div>

      {/* Section links — desktop only, very quiet */}
      <div
        className="hidden md:flex"
        style={{ gap: '3rem' }}
      >
        {['Entrance', 'Grand Hall', 'Living Path', 'Cultivation', 'Reflection'].map((label, i) => {
          const ids = ['entrance', 'grand-hall', 'living-path', 'cultivation', 'reflection']
          return (
            <button
              key={label}
              onClick={() => document.getElementById(ids[i])?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.62rem',
                fontWeight: 300,
                letterSpacing: '0.18em',
                color: 'rgba(244,240,232,0.38)',
                transition: 'color 0.35s ease',
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(244,240,232,0.75)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,240,232,0.38)'}
            >
              {label.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Right CTA — invisible glass */}
      <button
        onClick={() => document.getElementById('reflection')?.scrollIntoView({ behavior: 'smooth' })}
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
    </nav>
  )
}
