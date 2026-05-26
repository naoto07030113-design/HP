import { useEffect, useState } from 'react'

const navItems = [
  { label: '鍼灸', en: 'Acupuncture', href: '#acupuncture' },
  { label: 'リハビリ', en: 'Rehab', href: '#rehab' },
  { label: 'グループホーム', en: 'Group Home', href: '#grouphome' },
  { label: 'BIO PARK', en: 'Bio Park', href: '#biopark' },
]

export default function Navigation({ scrollProgress }) {
  const [visible, setVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setVisible(current < lastScroll || current < 100)
      setLastScroll(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScroll])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-all duration-700"
      style={{
        background: 'linear-gradient(180deg, rgba(8,13,11,0.9) 0%, transparent 100%)',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -20}px)`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 relative">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #2d8653, #c9a84c, #52b788, #2d8653)',
              animation: 'spin 8s linear infinite',
            }}
          />
          <div
            className="absolute inset-1 rounded-full"
            style={{ background: '#080d0b' }}
          />
          <div
            className="absolute inset-2.5 rounded-full"
            style={{ background: '#52b788', boxShadow: '0 0 8px #52b788' }}
          />
        </div>
        <div>
          <div className="text-xs font-display text-gold tracking-widest">伊藤医療</div>
          <div className="text-xs font-body text-white/40 tracking-[0.2em] uppercase" style={{ fontSize: '0.55rem' }}>
            Ito Medical Care
          </div>
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
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <span
              className="jp-text text-white/50 group-hover:text-white/90 transition-colors duration-300"
              style={{ fontSize: '0.7rem' }}
            >
              {item.label}
            </span>
            <span
              className="label-tag opacity-0 group-hover:opacity-60 transition-all duration-300"
              style={{ fontSize: '0.55rem' }}
            >
              {item.en}
            </span>
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <button className="btn-glass" style={{ padding: '0.5rem 1.5rem', fontSize: '0.6rem' }}>
          お問い合わせ
        </button>
      </div>
    </nav>
  )
}
