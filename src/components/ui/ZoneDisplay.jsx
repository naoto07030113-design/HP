import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Single zone display strip ─────────────────────────────────────
export function ZoneDisplay({ zone, triggerStart, triggerEnd }) {
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: `${triggerStart} top`,
            end: `${triggerEnd} top`,
            toggleActions: 'play reverse play reverse',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [triggerStart, triggerEnd])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: '2.2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        opacity: 0,
        width: 'min(520px, 92vw)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(14, 20, 10, 0.84)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(106,182,40,0.32)',
          borderTop: '2px solid #6AB628',
          borderRadius: '3px',
          padding: '1.1rem 1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.4rem',
          pointerEvents: 'auto',
        }}
      >
        {/* Left: zone info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.55rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#6AB628',
              marginBottom: '0.3rem',
            }}
          >
            {zone.tag}
          </div>
          <h3
            style={{
              fontFamily: 'Noto Serif JP, serif',
              fontSize: 'clamp(0.92rem, 2.4vw, 1.1rem)',
              fontWeight: 700,
              color: '#F8F7F2',
              lineHeight: 1.25,
              margin: '0 0 0.22rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {zone.name}
          </h3>
          <p
            style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.52)',
              lineHeight: 1.4,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {zone.sub}
          </p>
        </div>

        {/* Right: CTA */}
        <button
          onClick={() => navigate(zone.path)}
          style={{
            flexShrink: 0,
            background: '#6AB628',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '2px',
            padding: '0.55rem 1.15rem',
            fontSize: '0.75rem',
            fontFamily: 'Noto Sans JP, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.06em',
            transition: 'background 0.25s ease, box-shadow 0.25s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#58A010'
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(106,182,40,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6AB628'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          詳細を見る →
        </button>
      </div>
    </div>
  )
}

// ── Zone data ─────────────────────────────────────────────────────
export const ZONES = [
  {
    tag: 'ZONE 01 · 本院',
    name: 'イトー鍼灸整骨院',
    sub: '千葉県袖ケ浦市野里 ― 地域のかかりつけ治療院',
    path: '/honin',
    triggerStart: '18%',
    triggerEnd: '38%',
  },
  {
    tag: 'ZONE 02 · ストレッチ院',
    name: 'ストレッチ鍼灸イトー整骨院',
    sub: '千葉県袖ケ浦市長浦 ― ストレッチマシン導入',
    path: '/stretch',
    triggerStart: '36%',
    triggerEnd: '56%',
  },
  {
    tag: 'ZONE 03 · SANRI院',
    name: 'ピタ美ンスポット SANRI鍼灸整骨院',
    sub: '千葉県富津市 イオンモール富津3F',
    path: '/sanri',
    triggerStart: '55%',
    triggerEnd: '75%',
  },
  {
    tag: 'ZONE 04 · リハビリ',
    name: '伊藤リハビリセンター',
    sub: '千葉県袖ケ浦市野里 ― 訪問リハビリマッサージ',
    path: '/reha',
    triggerStart: '73%',
    triggerEnd: '92%',
  },
]
