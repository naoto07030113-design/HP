import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const clinics = [
  { label: '本院', path: '/honin' },
  { label: 'ストレッチ院', path: '/stretch' },
  { label: 'SANRI院', path: '/sanri' },
  { label: 'リハビリ', path: '/reha' },
]

export default function Navigation({ isPage = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <nav
      className="page-header"
      style={{
        zIndex: isPage ? 50 : 40,
        background: isPage
          ? 'rgba(248,249,245,0.98)'
          : 'rgba(248,249,245,0.88)',
      }}
    >
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#6AB628' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
          <div>
            <div
              className="jp-text font-bold leading-tight"
              style={{ fontSize: '0.78rem', color: '#1C2016', letterSpacing: '0.05em' }}
            >
              有限会社イトーメディカルケア
            </div>
            <div className="label-tag" style={{ fontSize: '0.52rem' }}>Ito Medical Care Co., Ltd.</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {clinics.map((c) => (
            <Link
              key={c.path}
              to={c.path}
              className="jp-text no-underline px-3 py-1.5 rounded transition-all duration-200"
              style={{
                fontSize: '0.78rem',
                color: location.pathname === c.path ? '#6AB628' : '#4A5240',
                fontWeight: location.pathname === c.path ? '600' : '400',
                background: location.pathname === c.path ? '#EFF8E8' : 'transparent',
              }}
            >
              {c.label}
            </Link>
          ))}
          <a href="tel:0438757886" className="btn-primary ml-3" style={{ padding: '0.45rem 1.2rem', fontSize: '0.75rem' }}>
            ☎ お問い合わせ
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '22px',
                  height: '2px',
                  background: '#1C2016',
                  transition: 'all 0.3s',
                  transform: menuOpen && i === 0 ? 'rotate(45deg) translateY(7px)' :
                             menuOpen && i === 1 ? 'scaleX(0)' :
                             menuOpen && i === 2 ? 'rotate(-45deg) translateY(-7px)' : 'none',
                }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: '#E8EDE4', background: 'rgba(248,249,245,0.98)' }}
        >
          {clinics.map((c) => (
            <Link
              key={c.path}
              to={c.path}
              onClick={() => setMenuOpen(false)}
              className="block jp-text no-underline px-5 py-3"
              style={{
                fontSize: '0.9rem',
                color: location.pathname === c.path ? '#6AB628' : '#1C2016',
                fontWeight: location.pathname === c.path ? '600' : '400',
                borderBottom: '1px solid #F0F2EE',
              }}
            >
              {c.label}
            </Link>
          ))}
          <a
            href="tel:0438757886"
            className="block jp-text no-underline px-5 py-3 font-medium"
            style={{ color: '#6AB628', fontSize: '0.9rem' }}
          >
            ☎ 0438-75-7886
          </a>
        </div>
      )}
    </nav>
  )
}
