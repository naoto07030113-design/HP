import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const VISIT_IMAGE =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80'

export default function Visit() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView   = useInView(sectionRef, { once: true, margin: '-15%' })

  const fade = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, delay: i * 0.13, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  return (
    <section
      ref={sectionRef}
      id="visit"
      className="relative overflow-hidden"
      style={{ minHeight: '70vh' }}
    >
      {/* Background photo */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src={VISIT_IMAGE}
          alt="BIO PARK exterior at dusk — plan your visit"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Gradient overlay — heavy on right/bottom for contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(11,19,11,0.3) 0%, rgba(11,19,11,0.72) 55%, rgba(11,19,11,0.96) 100%)',
        }}
      />

      {/* Additional bottom overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11,19,11,0.38)',
        }}
      />

      {/* Content — right aligned */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minHeight: '70vh',
          paddingLeft: 'clamp(2rem, 12%, 12rem)',
          paddingRight: 'clamp(2rem, 6%, 6rem)',
          paddingTop: 'clamp(5rem, 8vw, 8rem)',
          paddingBottom: 'clamp(5rem, 8vw, 8rem)',
        }}
      >
        <div style={{ maxWidth: '560px' }}>
          {/* Eyebrow */}
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="eyebrow mb-6"
          >
            VISIT
          </motion.p>

          {/* Headline */}
          <motion.h2
            custom={1}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="display-section mb-6"
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 4rem)',
              color: '#F5F3EC',
              fontStyle: 'normal',
            }}
          >
            Step Inside the Future of{' '}
            <em className="display-section" style={{ fontStyle: 'italic', fontSize: 'inherit', color: '#C9B26B' }}>
              Cultivation
            </em>
          </motion.h2>

          {/* Divider */}
          <motion.div
            custom={2}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="divider-botanical mb-8"
            style={{ width: '100px' }}
          />

          {/* Body */}
          <motion.p
            custom={3}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
              fontWeight: 300,
              letterSpacing: '0.02em',
              lineHeight: 1.8,
              color: 'rgba(245,243,236,0.6)',
              maxWidth: '440px',
              marginBottom: '1.5rem',
            }}
          >
            BIO PARK is open by reservation for individual visits, curated group
            experiences, and private events. Every visit is personally guided and designed
            around the current season.
          </motion.p>

          {/* Email */}
          <motion.a
            custom={4}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            href="mailto:info@biopark.jp"
            style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 400,
              letterSpacing: '0.2em',
              color: '#8DAF74',
              textDecoration: 'none',
              textTransform: 'uppercase',
              marginBottom: '2.5rem',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9B26B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8DAF74')}
          >
            info@biopark.jp
          </motion.a>

          {/* CTA */}
          <motion.div
            custom={5}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <a
              href="mailto:info@biopark.jp"
              className="btn-ghost"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              PLAN YOUR VISIT →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
