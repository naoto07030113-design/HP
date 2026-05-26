import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sections = [
  {
    id: 'acupuncture',
    number: '01',
    tag: 'Zone One',
    title: '鍼灸・手技療法',
    en: 'Acupuncture & Manual Therapy',
    color: '#c9a84c',
    triggerStart: '15%',
    triggerEnd: '35%',
  },
  {
    id: 'rehab',
    number: '02',
    tag: 'Zone Two',
    title: '機能リハビリ',
    en: 'Functional Rehabilitation',
    color: '#52b788',
    triggerStart: '35%',
    triggerEnd: '55%',
  },
  {
    id: 'grouphome',
    number: '03',
    tag: 'Zone Three',
    title: 'グループホーム',
    en: 'Group Home Care',
    color: '#74c69d',
    triggerStart: '55%',
    triggerEnd: '75%',
  },
  {
    id: 'biopark',
    number: '04',
    tag: 'Zone Four',
    title: 'BIO PARK',
    en: 'Future Healthcare Agriculture',
    color: '#52b788',
    triggerStart: '75%',
    triggerEnd: '95%',
  },
]

function ZoneLabel({ section }) {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#scroll-root',
            start: `${section.triggerStart} top`,
            end: `${section.triggerEnd} top`,
            toggleActions: 'play reverse play reverse',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [section])

  return (
    <div
      ref={ref}
      className="fixed bottom-12 left-8 z-30 pointer-events-none"
      style={{ opacity: 0 }}
    >
      <div className="flex items-end gap-4">
        <div
          className="font-display text-white/8"
          style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', lineHeight: 1, color: 'rgba(255,255,255,0.03)' }}
        >
          {section.number}
        </div>
        <div className="mb-2">
          <div className="label-tag mb-1">{section.tag}</div>
          <div
            className="jp-text"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
              color: section.color,
              fontWeight: 300,
              textShadow: `0 0 30px ${section.color}80`,
            }}
          >
            {section.title}
          </div>
          <div
            className="font-body text-white/30 font-light"
            style={{ fontSize: '0.75rem', letterSpacing: '0.12em', marginTop: '0.2rem' }}
          >
            {section.en}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SectionLabels() {
  return (
    <>
      {sections.map((s) => (
        <ZoneLabel key={s.id} section={s} />
      ))}
    </>
  )
}
