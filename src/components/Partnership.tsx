import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const PARTNER_IMAGE =
  'https://images.unsplash.com/photo-1585015058898-9ef0e9a54c36?auto=format&fit=crop&w=1200&q=80'

export default function Partnership() {
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
      id="partnership"
      className="relative overflow-hidden"
      style={{ minHeight: '70vh' }}
    >
      {/* Background photo */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src={PARTNER_IMAGE}
          alt="BIO PARK greenhouse interior — partnership"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Gradient overlay — strong left side */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(11,19,11,0.96) 0%, rgba(11,19,11,0.78) 45%, rgba(11,19,11,0.35) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          minHeight: '70vh',
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 12%, 12rem)',
          paddingTop: 'clamp(5rem, 8vw, 8rem)',
          paddingBottom: 'clamp(5rem, 8vw, 8rem)',
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          {/* Eyebrow */}
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="eyebrow mb-6"
          >
            PARTNERSHIP
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
              fontStyle: 'italic',
            }}
          >
            Grow With BIO PARK
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
              maxWidth: '460px',
              marginBottom: '2.5rem',
            }}
          >
            We collaborate with farmers, scientists, chefs, architects, and brands who share
            our belief in a living future. Our partnership programme is selective, meaningful,
            and built for longevity. If you grow something worth sharing, we want to hear from
            you.
          </motion.p>

          {/* CTA */}
          <motion.div
            custom={4}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <a
              href="mailto:partners@biopark.jp"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              BECOME A PARTNER →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
