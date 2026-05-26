import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ClinicCard({ clinic, side, triggerStart, triggerEnd }) {
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          x: side === 'left' ? -40 : 40,
          y: '-50%',
        },
        {
          opacity: 1,
          x: 0,
          y: '-50%',
          duration: 0.7,
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
  }, [side, triggerStart, triggerEnd])

  return (
    <div
      ref={ref}
      className={`clinic-overlay ${side}`}
      style={{ opacity: 0, transform: 'translateY(-50%)' }}
    >
      <div className="card-white" style={{ padding: '1.6rem 1.8rem', borderRadius: '6px' }}>
        {/* Number + Tag */}
        <div className="flex items-center justify-between mb-3">
          <div className="label-tag">{clinic.tag}</div>
          <div className="section-num" style={{ fontSize: '2.5rem', lineHeight: 1 }}>{clinic.num}</div>
        </div>

        {/* Green top border */}
        <div className="divider-green mb-4" />

        {/* Clinic name */}
        <h3 className="jp-text font-bold mb-1" style={{ fontSize: '1.35rem', color: '#1C2016', lineHeight: 1.3 }}>
          {clinic.name}
        </h3>
        <div className="jp-text mb-4" style={{ fontSize: '0.75rem', color: '#6AB628', fontWeight: 500 }}>
          {clinic.tagline}
        </div>

        {/* Info rows */}
        <div className="mb-4">
          {[
            { label: '住所', value: clinic.address },
            { label: 'TEL', value: clinic.tel },
            { label: '受付', value: clinic.hours },
          ].map((row) => (
            <div key={row.label} className="info-row">
              <span className="label">{row.label}</span>
              <span style={{ fontSize: '0.8rem', color: '#3A4030', lineHeight: 1.5 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {clinic.features.map((f) => (
            <span
              key={f}
              className="jp-text"
              style={{
                fontSize: '0.68rem',
                background: '#EFF8E8',
                color: '#4A8018',
                border: '1px solid rgba(106,182,40,0.25)',
                borderRadius: '2px',
                padding: '0.2rem 0.6rem',
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          className="btn-primary w-full justify-center"
          style={{ fontSize: '0.82rem' }}
          onClick={() => navigate(clinic.path)}
        >
          {clinic.name}のページへ →
        </button>
      </div>
    </div>
  )
}

// ── All four clinic card configs ─────────────────────────────────
export const CLINICS = [
  {
    num: '01',
    tag: 'Zone 01 · 本院',
    name: 'イトー鍼灸整骨院',
    tagline: '袖ケ浦市野里 ― 地域のかかりつけ治療院',
    address: '千葉県袖ケ浦市野里1770-3',
    tel: '0438-75-5557',
    hours: 'AM 9:00-12:00 / PM 2:00-7:30（金曜定休）',
    features: ['鍼灸治療', '整骨・整体', '交通事故', '各種保険', 'スポーツ外傷'],
    path: '/honin',
    side: 'left',
    triggerStart: '18%',
    triggerEnd: '38%',
  },
  {
    num: '02',
    tag: 'Zone 02 · ストレッチ院',
    name: 'ストレッチ鍼灸\nイトー整骨院',
    tagline: '袖ケ浦市長浦 ― ストレッチマシン導入',
    address: '千葉県袖ケ浦市長浦駅前2-4-10',
    tel: '0438-53-8853',
    hours: '月〜土 9:30-12:00/14:30-20:00\n日曜 9:30-17:00（金曜定休）',
    features: ['ストレッチマシン', '鍼灸治療', '整体', '交通事故', '各種保険'],
    path: '/stretch',
    side: 'right',
    triggerStart: '36%',
    triggerEnd: '56%',
  },
  {
    num: '03',
    tag: 'Zone 03 · SANRI院',
    name: 'ピタ美ンスポット\nSANRI鍼灸整骨院',
    tagline: '富津市イオンモール3F ― 商業施設内の治療院',
    address: '千葉県富津市青木1丁目5番地1\nイオンモール富津3F',
    tel: '0439-32-1771',
    hours: 'AM 10:00-13:30 / PM 14:30-20:00（金曜定休）',
    features: ['鍼灸治療', '整骨', '美容鍼', '交通事故', '各種保険'],
    path: '/sanri',
    side: 'left',
    triggerStart: '55%',
    triggerEnd: '75%',
  },
  {
    num: '04',
    tag: 'Zone 04 · リハビリ',
    name: '伊藤リハビリセンター',
    tagline: '訪問リハビリマッサージ ― ご自宅へお伺い',
    address: '千葉県袖ケ浦市野里1770-3',
    tel: '0438-75-7737',
    hours: '受付 8:00-18:00（日曜のみ休み）',
    features: ['訪問マッサージ', '機能訓練', '在宅リハビリ', '保険適用', '要介護対応'],
    path: '/reha',
    side: 'right',
    triggerStart: '73%',
    triggerEnd: '92%',
  },
]
