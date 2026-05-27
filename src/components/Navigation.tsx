import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const NAV_LINKS = [
  { label: 'VISION',       href: '#vision' },
  { label: 'EXPERIENCE',   href: '#experiences' },
  { label: 'CULTIVATION',  href: '#journey' },
  { label: 'VISIT',        href: '#visit' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      ref={navRef}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12"
      style={{
        height: '72px',
        background: scrolled
          ? 'rgba(11,19,11,0.72)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(141,175,116,0.08)' : '1px solid transparent',
        transition: 'background 0.5s ease, backdrop-filter 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* LEFT: Logotype */}
      <a
        href="#"
        className="flex flex-col items-start leading-none select-none"
        style={{ gap: '2px' }}
        aria-label="BIO PARK home"
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: '#F5F3EC',
            textTransform: 'uppercase',
          }}
        >
          BIO
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 300,
            letterSpacing: '0.35em',
            color: '#8DAF74',
            textTransform: 'uppercase',
          }}
        >
          PARK
        </span>
      </a>

      {/* CENTER: Links */}
      <div className="hidden md:flex items-center gap-10">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="relative group"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 400,
              letterSpacing: '0.25em',
              color: 'rgba(245,243,236,0.72)',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F3EC')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,243,236,0.72)')}
          >
            {link.label}
            <span
              className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-px transition-all duration-500"
              style={{ background: 'linear-gradient(90deg, #5C8A63, #C9B26B)' }}
            />
          </a>
        ))}
      </div>

      {/* RIGHT: CTA */}
      <a
        href="#visit"
        className="hidden md:inline-flex items-center gap-2 btn-ghost"
        style={{
          padding: '0.5rem 1.25rem',
          fontSize: '0.6875rem',
          letterSpacing: '0.18em',
          borderColor: 'rgba(141,175,116,0.3)',
          color: '#F5F3EC',
          textDecoration: 'none',
        }}
      >
        RESERVE ACCESS
        <span style={{ fontStyle: 'normal' }}>→</span>
      </a>

      {/* Mobile: hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        aria-label="Open menu"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span className="block w-5 h-px" style={{ background: '#F5F3EC' }} />
        <span className="block w-5 h-px" style={{ background: '#F5F3EC' }} />
      </button>
    </motion.nav>
  )
}
