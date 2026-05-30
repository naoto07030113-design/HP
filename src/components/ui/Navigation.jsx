import { useEffect, useRef, useState } from 'react'

const navItems = [
  { label: 'Entrance',    href: '#entrance'   },
  { label: 'Grand Hall',  href: '#grand-hall'  },
  { label: 'Living Path', href: '#living-path' },
  { label: 'Cultivation', href: '#cultivation' },
  { label: 'Reflection',  href: '#reflection'  },
]

export default function Navigation({ scrollRef }) {
  const [visible, setVisible] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const [activeScene, setActiveScene] = useState(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setAtTop(current < 60)
      setVisible(current < lastScrollY.current || current < 80)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!scrollRef) return
    let raf
    const update = () => {
      setActiveScene(Math.min(Math.floor(scrollRef.current * 5), 4))
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        padding: '1.4rem 2.5rem',
        background: atTop
          ? 'linear-gradient(180deg, rgba(26,46,24,0.85) 0%, transparent 100%)'
          : 'rgba(26,46,24,0.7)',
        backdropFilter: atTop ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: atTop ? 'none' : 'blur(16px)',
        borderBottom: atTop ? 'none' : '1px solid rgba(106,184,80,0.1)',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -16}px)`,
        transition: 'opacity 0.6s ease, transform 0.6s ease, background 0.5s ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        {/* Leaf mark */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50% 50% 50% 0',
            background: 'linear-gradient(135deg, #3a7a30, #6ab850)',
            transform: 'rotate(-45deg)',
            boxShadow: '0 0 16px rgba(106,184,80,0.25)',
          }}
        />
        <div>
          <div
            className="font-display"
            style={{ fontSize: '1.05rem', fontWeight: 400, letterSpacing: '0.18em', color: '#f4f0e8' }}
          >
            BIO PARK
          </div>
          <div
            className="font-body"
            style={{ fontSize: '0.52rem', letterSpacing: '0.28em', color: 'rgba(138,184,128,0.7)', marginTop: '-1px' }}
          >
            Greenhouse & Nature
          </div>
        </div>
      </div>

      {/* Section links */}
      <div className="hidden md:flex items-center gap-7">
        {navItems.map((item, idx) => {
          const isActive = activeScene === idx
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                const el = document.querySelector(item.href)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="font-body cursor-pointer"
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.15em',
                color: isActive ? '#8ab880' : 'rgba(244,240,232,0.45)',
                transition: 'color 0.4s ease',
                textDecoration: 'none',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = isActive ? '#a8d098' : 'rgba(244,240,232,0.9)' }}
              onMouseLeave={e => { e.currentTarget.style.color = isActive ? '#8ab880' : 'rgba(244,240,232,0.45)' }}
            >
              {item.label}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'linear-gradient(90deg, #6ab850, transparent)',
                  }}
                />
              )}
            </a>
          )
        })}
      </div>

      {/* CTA */}
      <div>
        <button
          className="btn-primary"
          style={{ padding: '0.55rem 1.6rem', fontSize: '0.62rem' }}
          onClick={() => {
            const el = document.getElementById('reflection')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Contact
        </button>
      </div>
    </nav>
  )
}
