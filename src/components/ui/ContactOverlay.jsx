import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ContactOverlay() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: '90% top',
            end: '100% top',
            toggleActions: 'play none none reverse',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-20 flex items-center justify-center"
      style={{
        opacity: 0,
        pointerEvents: 'none',
        background: 'rgba(248,249,245,0.9)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="pointer-events-auto text-center max-w-lg px-8"
        style={{ background: 'rgba(255,255,255,0.98)', borderRadius: '8px', padding: '3rem 2.5rem', border: '1px solid #E0E8D8', boxShadow: '0 8px 48px rgba(0,0,0,0.08)' }}
      >
        <div className="label-tag mb-4">お問い合わせ · Contact</div>

        <h2 className="font-display mb-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#1C2016', fontWeight: 400 }}>
          お気軽にご相談を
        </h2>
        <div className="jp-text mb-6" style={{ fontSize: '0.85rem', color: '#6AB628', fontWeight: 500 }}>
          Ito Medical Care Co., Ltd.
        </div>

        <div className="divider-green mb-6" />

        <p className="jp-text mb-8" style={{ fontSize: '0.85rem', color: '#4A5240', lineHeight: 2 }}>
          鍼灸・整骨・在宅リハビリまで、<br />
          地域の皆さまの健康をトータルにサポートします。<br />
          まずはお気軽にお電話ください。
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: '本社・本院', tel: '0438-75-7886' },
            { label: 'ストレッチ院', tel: '0438-53-8853' },
            { label: 'SANRI院', tel: '0439-32-1771' },
            { label: 'リハビリ', tel: '0438-75-7737' },
          ].map((item) => (
            <a
              key={item.label}
              href={`tel:${item.tel.replace(/-/g, '')}`}
              className="card-accent jp-text no-underline"
              style={{ padding: '0.8rem 1rem', display: 'block' }}
            >
              <div style={{ fontSize: '0.62rem', color: '#8A9280', marginBottom: '0.2rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.9rem', color: '#1C2016', fontWeight: 600 }}>☎ {item.tel}</div>
            </a>
          ))}
        </div>

        <div className="label-tag" style={{ color: '#B0B8A8', fontSize: '0.52rem' }}>
          © 2025 有限会社イトーメディカルケア · All Rights Reserved
        </div>
      </div>
    </div>
  )
}
