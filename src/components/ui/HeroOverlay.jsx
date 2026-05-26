import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.h-tag',   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1,   delay: 0.4, ease: 'power3.out' })
      gsap.fromTo('.h-title', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.7, stagger: 0.12, ease: 'power3.out' })
      gsap.fromTo('.h-line',  { scaleX: 0 },         { scaleX: 1, duration: 1.4, delay: 0.9, ease: 'power3.inOut', transformOrigin: 'left' })
      gsap.fromTo('.h-sub',   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1,   delay: 1.2, ease: 'power3.out' })
      gsap.fromTo('.h-cta',   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, delay: 1.6, ease: 'power3.out' })
      gsap.fromTo('.h-scroll',{ opacity: 0 },        { opacity: 1,         duration: 1,   delay: 2.1, ease: 'power3.out' })

      // fade out as user scrolls into first zone
      gsap.to(ref.current, {
        opacity: 0, y: -30, ease: 'power2.in',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '8% top', end: '20% top',
          scrub: 1,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-center"
      style={{ padding: '0 7vw', paddingTop: '3.5rem' }}
    >
      <div className="max-w-xl">
        {/* Tag */}
        <div className="h-tag label-tag mb-5 flex items-center gap-3" style={{ opacity: 0 }}>
          <div style={{ width: '24px', height: '2px', background: '#6AB628' }} />
          有限会社イトーメディカルケア ― 千葉県袖ケ浦市
        </div>

        {/* Main title */}
        <h1 className="font-display mb-5" style={{ lineHeight: 1.05 }}>
          <div className="h-title jp-text" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', color: '#1C2016', fontWeight: 400, opacity: 0 }}>
            地域の暮らしに、
          </div>
          <div className="h-title" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', fontWeight: 300, opacity: 0, display: 'flex', alignItems: 'baseline', gap: '0.15em' }}>
            <span className="jp-text" style={{ color: '#1C2016' }}>医療と福祉の</span>
            <span style={{ color: '#6AB628', fontWeight: 600 }}>安心</span>
            <span className="jp-text" style={{ color: '#1C2016' }}>を。</span>
          </div>
        </h1>

        {/* Divider */}
        <div className="h-line" style={{ height: '2px', width: '160px', background: 'linear-gradient(90deg, #6AB628, rgba(106,182,40,0.2))', marginBottom: '1.5rem' }} />

        {/* Sub */}
        <p className="h-sub jp-text" style={{ fontSize: 'clamp(0.82rem, 1.4vw, 0.96rem)', color: '#4A5240', fontWeight: 300, lineHeight: 1.9, maxWidth: '400px', opacity: 0 }}>
          鍼灸・整骨から在宅リハビリまで。<br />
          地域に根ざした医療・福祉のトータルサポート。
        </p>

        {/* CTA */}
        <div className="h-cta flex items-center gap-4 mt-7 pointer-events-auto" style={{ opacity: 0 }}>
          <a href="#acupuncture" onClick={e => { e.preventDefault(); window.scrollTo({ top: window.innerHeight * 0.2, behavior: 'smooth' }) }} className="btn-primary">
            各院を見る →
          </a>
          <span className="jp-text" style={{ fontSize: '0.75rem', color: '#8A9280' }}>スクロールで各院へ</span>
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="h-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none" style={{ opacity: 0 }}>
        <span className="label-tag" style={{ fontSize: '0.5rem', color: '#8A9280' }}>SCROLL</span>
        <div style={{ width: '1px', height: '36px', background: 'linear-gradient(180deg, #6AB628, transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }} />
        <style>{`@keyframes scrollPulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
      </div>
    </div>
  )
}
