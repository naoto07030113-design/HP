import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface PhilosophyPillar {
  number: string
  title: string
  body: string
  image: string
}

const PILLARS: PhilosophyPillar[] = [
  {
    number: '01',
    title: 'Cultivated with intention',
    body: 'Every plant, pathway, and process at BIO PARK is designed with purpose. Nothing is incidental. We cultivate not just crops but experiences that reconnect people to the source of life.',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  },
  {
    number: '02',
    title: 'Powered by microbial ecology',
    body: 'Beneath the visible is an invisible world of microbial intelligence. We harness fermentation, composting, and living soil science to power everything we do — from nutrition to natural materials.',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80',
  },
  {
    number: '03',
    title: 'Designed for human connection',
    body: 'Food, ecology, and shared experience have always been the foundation of community. BIO PARK creates spaces where people gather, slow down, and remember what it means to be part of nature.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
  },
]

function PillarCard({ pillar, index }: { pillar: PhilosophyPillar; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 1.1, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden group"
      style={{ minHeight: '520px' }}
    >
      {/* Background photo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <motion.img
          src={pillar.image}
          alt={pillar.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Dark overlay — heavier at bottom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(11,19,11,0.97) 0%, rgba(11,19,11,0.72) 40%, rgba(11,19,11,0.25) 100%)',
        }}
      />

      {/* Hover tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: 'rgba(11,19,11,0.15)' }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
          minHeight: '520px',
          padding: '2.5rem',
        }}
      >
        {/* Number tag */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.5625rem',
            fontWeight: 400,
            letterSpacing: '0.3em',
            color: '#8DAF74',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}
        >
          {pillar.number} /
        </span>

        {/* Divider line */}
        <div
          className="origin-left transition-all duration-700 group-hover:w-16"
          style={{
            width: '32px',
            height: '1px',
            background: 'linear-gradient(90deg, #5C8A63, #C9B26B)',
            marginBottom: '1.25rem',
          }}
        />

        {/* Title */}
        <h3
          className="display-section"
          style={{
            fontSize: 'clamp(1.4rem, 1.9vw, 1.75rem)',
            color: '#F5F3EC',
            fontStyle: 'italic',
            marginBottom: '1rem',
          }}
        >
          {pillar.title}
        </h3>

        {/* Body */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8125rem',
            fontWeight: 300,
            letterSpacing: '0.02em',
            lineHeight: 1.75,
            color: 'rgba(245,243,236,0.55)',
            maxWidth: '340px',
            transition: 'color 0.4s ease',
          }}
          className="group-hover:text-[rgba(245,243,236,0.75)]"
        >
          {pillar.body}
        </p>
      </div>
    </motion.div>
  )
}

export default function Philosophy() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView   = useInView(sectionRef, { once: true, margin: '-15%' })

  return (
    <section
      ref={sectionRef}
      id="cultivation"
      style={{
        background: '#0B130B',
        paddingTop: 'clamp(5rem, 8vw, 9rem)',
        paddingBottom: 'clamp(5rem, 8vw, 9rem)',
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 6%, 6rem)',
          marginBottom: '3.5rem',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow mb-5"
        >
          OUR PHILOSOPHY
        </motion.p>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <h2
            className="display-section"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
              color: '#F5F3EC',
              fontStyle: 'italic',
              maxWidth: '600px',
            }}
          >
            Three principles that guide{' '}
            <em style={{ fontStyle: 'italic', color: '#C9B26B' }}>everything.</em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="divider-botanical mt-8 origin-left"
        />
      </div>

      {/* Three-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 6%, 6rem)',
          background: 'rgba(141,175,116,0.06)',
        }}
        className="max-md:grid-cols-1 max-lg:grid-cols-1"
      >
        {PILLARS.map((pillar, i) => (
          <PillarCard key={pillar.number} pillar={pillar} index={i} />
        ))}
      </div>
    </section>
  )
}
