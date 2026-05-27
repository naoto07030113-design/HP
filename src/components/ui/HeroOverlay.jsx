import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance sequence
      gsap.fromTo('.h-tag',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 1.1, delay: 0.5, ease: 'power3.out' }
      )
      gsap.fromTo('.h-title',
        { opacity: 0, y: 36, skewY: 2 },
        { opacity: 1, y: 0, skewY: 0, duration: 1.3, delay: 0.8, stagger: 0.16, ease: 'power3.out' }
      )
      gsap.fromTo('.h-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, delay: 1.0, ease: 'power3.inOut', transformOrigin: 'left' }
      )
      gsap.fromTo('.h-sub',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.1, delay: 1.4, ease: 'power3.out' }
      )
      gsap.fromTo('.h-cta',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.0, delay: 1.8, ease: 'power3.out' }
      )
      gsap.fromTo('.h-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 1.0, delay: 2.4, ease: 'power3.out' }
      )

      // Scroll-driven exit
      gsap.to(ref.current, {
        opacity: 0,
        y: -40,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '7% top',
          end: '19% top',
          scrub: 1.2,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-center"
      style={{ padding: '0 7vw', paddingTop: '4rem' }}
    >
      {/* Subtle left-edge gradient to improve text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(100deg, rgba(237,236,234,0.72) 0%, rgba(237,236,234,0.3) 55%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-2xl" style={{ position: 'relative' }}>
        {/* Zone tag */}
        <div
          className="h-tag flex items-center gap-3 mb-6"
          style={{ opacity: 0 }}
        >
          <div style={{ width: '32px', height: '1.5px', background: '#6AB628' }} />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.58rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#6AB628',
            }}
          >
            有限会社イトーメディカルケア ― 千葉県
          </span>
        </div>

        {/* Main title */}
        <h1 style={{ lineHeight: 1.05, marginBottom: '1.8rem' }}>
          <div
            className="h-title jp-text"
            style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 5.5rem)',
              fontWeight: 400,
              color: '#1A1E14',
              opacity: 0,
              letterSpacing: '-0.01em',
            }}
          >
            地域の暮らしに、
          </div>
          <div
            className="h-title"
            style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 5.5rem)',
              fontWeight: 300,
              opacity: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.08em',
              flexWrap: 'wrap',
              letterSpacing: '-0.01em',
            }}
          >
            <span className="jp-text" style={{ color: '#1A1E14' }}>医療と福祉の</span>
            <span
              style={{
                color: '#6AB628',
                fontWeight: 700,
                fontFamily: 'Noto Serif JP, serif',
              }}
            >
              安心
            </span>
            <span className="jp-text" style={{ color: '#1A1E14' }}>を。</span>
          </div>
        </h1>

        {/* Green divider line */}
        <div
          className="h-line"
          style={{
            height: '1.5px',
            width: '180px',
            background: 'linear-gradient(90deg, #6AB628 0%, rgba(106,182,40,0.15) 100%)',
            marginBottom: '1.8rem',
          }}
        />

        {/* Subtitle */}
        <p
          className="h-sub jp-text"
          style={{
            fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
            color: '#4A5240',
            fontWeight: 300,
            lineHeight: 2.0,
            maxWidth: '380px',
            opacity: 0,
          }}
        >
          鍼灸・整骨から在宅リハビリまで。<br />
          地域に根ざした医療・福祉のトータルサポート。
        </p>

        {/* CTA */}
        <div
          className="h-cta flex items-center gap-5 mt-8 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <a
            href="#acupuncture"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: window.innerHeight * 0.22, behavior: 'smooth' })
            }}
            className="btn-primary"
          >
            各院を見る →
          </a>
          <span
            className="jp-text"
            style={{ fontSize: '0.72rem', color: '#8A9280', letterSpacing: '0.04em' }}
          >
            スクロールで各院へ
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="h-scroll absolute flex flex-col items-center gap-2"
        style={{ bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', opacity: 0, pointerEvents: 'none' }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.5rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#8A9280',
          }}
        >
          SCROLL
        </span>
        <div
          style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(180deg, #6AB628 0%, transparent 100%)',
            animation: 'scrollPulse 2.2s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes scrollPulse { 0%,100%{opacity:.25} 50%{opacity:1} }`}</style>
      </div>
    </div>
  )
}
