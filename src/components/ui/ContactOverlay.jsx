import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ContactOverlay() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: '88% top',
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
      className="fixed inset-0 z-20 pointer-events-none flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(8,13,11,0.85) 30%)', opacity: 0 }}
    >
      <div className="pointer-events-auto text-center max-w-xl px-8">
        <div className="label-tag mb-6">Contact · お問い合わせ</div>

        <h2
          className="font-display text-white mb-3"
          style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 1.1 }}
        >
          未来の医療へ
        </h2>
        <h2
          className="font-display mb-8"
          style={{
            fontSize: 'clamp(1.2rem, 3vw, 2.2rem)',
            fontWeight: 300,
            background: 'linear-gradient(135deg, #c9a84c, #52b788)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.06em',
          }}
        >
          A New Standard in Care
        </h2>

        <div className="divider-gold mb-8" />

        <p
          className="font-body text-white/40 font-light mb-10 leading-relaxed"
          style={{ fontSize: '0.85rem' }}
        >
          Whether you are seeking healing, rehabilitation, community care,
          or exploring the future of healthcare with BIO PARK —
          we are here for every step.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="btn-glass">
            施設見学を予約する
          </button>
          <button
            className="font-body text-white/40 hover:text-white/70 transition-colors duration-300"
            style={{ fontSize: '0.75rem', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            資料をダウンロード →
          </button>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {[
            { label: '電話', value: '03-0000-0000', en: 'Phone' },
            { label: '住所', value: '東京都', en: 'Location' },
            { label: '受付時間', value: '9:00-18:00', en: 'Hours' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="label-tag mb-1">{item.en}</div>
              <div className="jp-text text-white/60" style={{ fontSize: '0.75rem' }}>{item.label}</div>
              <div className="font-body text-white/40 font-light" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom brand mark */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="divider-gold" style={{ width: '60px' }} />
          <div className="font-display text-white/20" style={{ fontSize: '0.7rem', letterSpacing: '0.3em' }}>
            伊藤医療 · Ito Medical Care
          </div>
          <div className="label-tag text-white/15" style={{ fontSize: '0.5rem' }}>
            © 2025 All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  )
}
