import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const plans = [
  {
    id: 'sprout',
    name: 'Sprout',
    nameJp: '芽吹き',
    price: '¥2,800',
    period: '/月',
    description: 'Begin your journey with BIO PARK.',
    features: [
      '月2回 入館パス',
      'シーズナルニュースレター',
      'カフェ 10% 割引',
      'オンラインコミュニティ',
    ],
    accent: 'rgba(106,184,80,0.5)',
    accentSolid: '#6ab850',
  },
  {
    id: 'grove',
    name: 'Grove',
    nameJp: '木立',
    price: '¥6,500',
    period: '/月',
    description: 'Immerse yourself in the living sanctuary.',
    features: [
      '入館 無制限',
      '優先イベントアクセス',
      'カフェ 20% 割引',
      '月1回 植物ケアWS',
      '季節の植物ギフト',
    ],
    accent: 'rgba(138,184,128,0.65)',
    accentSolid: '#8ab880',
    featured: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    nameJp: '深林',
    price: '¥14,800',
    period: '/月',
    description: 'Full stewardship of the greenhouse.',
    features: [
      'Grove プランすべて',
      'プライベート栽培区画',
      '専属ガイドセッション (月1)',
      'イベント優先予約 + ゲスト招待',
      '年間 特別植物プレゼント',
    ],
    accent: 'rgba(244,240,232,0.35)',
    accentSolid: '#f4f0e8',
  },
]

function PlanCard({ plan, index }) {
  const ref = useRef()

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.15 + index * 0.12, ease: 'power3.out' }
    )
  }, [index])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        flex: '1 1 240px',
        maxWidth: 300,
        background: plan.featured
          ? 'rgba(106,184,80,0.07)'
          : 'rgba(244,240,232,0.04)',
        border: `1px solid ${plan.featured ? 'rgba(106,184,80,0.35)' : 'rgba(244,240,232,0.1)'}`,
        borderRadius: 2,
        padding: '2rem 1.6rem',
        position: 'relative',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'border-color 0.4s ease, background 0.4s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = plan.accentSolid + '66'
        e.currentTarget.style.background = 'rgba(106,184,80,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = plan.featured ? 'rgba(106,184,80,0.35)' : 'rgba(244,240,232,0.1)'
        e.currentTarget.style.background = plan.featured ? 'rgba(106,184,80,0.07)' : 'rgba(244,240,232,0.04)'
      }}
    >
      {plan.featured && (
        <div
          className="label-tag"
          style={{
            position: 'absolute',
            top: '-1px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            background: '#1a2e18',
            padding: '0.25rem 1rem',
            color: '#6ab850',
            border: '1px solid rgba(106,184,80,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          Most Popular
        </div>
      )}

      {/* Accent line */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${plan.accentSolid}66, transparent)`, marginBottom: '1.5rem' }} />

      {/* Name */}
      <div style={{ marginBottom: '0.2rem' }}>
        <span
          className="font-display"
          style={{ fontSize: '1.6rem', fontWeight: 400, fontStyle: 'italic', color: plan.accentSolid, letterSpacing: '0.04em' }}
        >
          {plan.name}
        </span>
        <span
          className="font-body"
          style={{ fontSize: '0.58rem', color: 'rgba(244,240,232,0.3)', letterSpacing: '0.22em', marginLeft: '0.7rem' }}
        >
          {plan.nameJp}
        </span>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.6rem' }}>
        <span
          className="font-display"
          style={{ fontSize: '2.2rem', fontWeight: 400, color: '#f4f0e8', letterSpacing: '-0.01em' }}
        >
          {plan.price}
        </span>
        <span
          className="font-body"
          style={{ fontSize: '0.65rem', color: 'rgba(244,240,232,0.35)', letterSpacing: '0.1em' }}
        >
          {plan.period}
        </span>
      </div>

      {/* Description */}
      <p
        className="font-body"
        style={{ fontSize: '0.72rem', color: 'rgba(244,240,232,0.35)', lineHeight: 1.6, marginBottom: '1.6rem', letterSpacing: '0.02em' }}
      >
        {plan.description}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(244,240,232,0.06)', marginBottom: '1.4rem' }} />

      {/* Features */}
      <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {plan.features.map((f) => (
          <li
            key={f}
            className="font-body"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.72rem', color: 'rgba(244,240,232,0.55)', letterSpacing: '0.02em', lineHeight: 1.5 }}
          >
            <span style={{ color: plan.accentSolid, flexShrink: 0, marginTop: '0.1em' }}>·</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className="btn-primary"
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '0.6rem',
          background: plan.featured ? 'rgba(106,184,80,0.15)' : 'rgba(244,240,232,0.06)',
          borderColor: plan.featured ? 'rgba(106,184,80,0.45)' : 'rgba(244,240,232,0.2)',
        }}
      >
        {plan.featured ? 'Join Grove' : `Join ${plan.name}`}
      </button>
    </div>
  )
}

export default function SubscriptionOverlay({ open, onClose }) {
  const overlayRef = useRef()
  const contentRef = useRef()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
      gsap.fromTo(contentRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => setVisible(false),
      })
    }
  }, [open])

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(10,20,10,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        overflowY: 'auto',
        opacity: 0,
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div ref={contentRef} style={{ width: '100%', maxWidth: 980, opacity: 0 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="label-tag" style={{ color: '#8ab880', marginBottom: '1rem' }}>
            Membership Plans · 会員プラン
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: '#f4f0e8', letterSpacing: '0.04em', marginBottom: '0.5rem' }}
          >
            Grow With Us
          </h2>
          <p
            className="font-body"
            style={{ fontSize: '0.8rem', color: 'rgba(244,240,232,0.35)', letterSpacing: '0.04em', lineHeight: 1.8 }}
          >
            Choose your level of connection with the living sanctuary.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p className="font-body" style={{ fontSize: '0.65rem', color: 'rgba(244,240,232,0.2)', letterSpacing: '0.08em', lineHeight: 1.8 }}>
            すべてのプランは月払い · いつでもキャンセル可能 · 消費税込み
          </p>
        </div>

        {/* Close */}
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.62rem', letterSpacing: '0.2em' }}
            onClick={onClose}
          >
            ← Close
          </button>
        </div>
      </div>
    </div>
  )
}
