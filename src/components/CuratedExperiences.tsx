import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface ExperienceCard {
  number: string
  title: string
  description: string
  image: string
}

const EXPERIENCES: ExperienceCard[] = [
  {
    number: '01',
    title: 'Greenhouse Walk',
    description: 'Immersive botanical pathways.',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
  },
  {
    number: '02',
    title: 'Fermentation Atelier',
    description: 'Hands-on microbial craft.',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    number: '03',
    title: 'Living Harvest',
    description: 'Interactive cultivation experiences.',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    number: '04',
    title: 'Botanical Dining',
    description: 'Seasonal ecosystem cuisine.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  },
]

function ExperienceCard({ card, index }: { card: ExperienceCard; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 1.0, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden group"
      style={{
        aspectRatio: '3 / 4',
        cursor: 'pointer',
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(11,19,11,0.95) 0%, rgba(11,19,11,0.5) 45%, rgba(11,19,11,0.18) 100%)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'rgba(11,19,11,0.25)',
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        {/* Top: number + arrow */}
        <div className="flex items-start justify-between">
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.625rem',
              fontWeight: 400,
              letterSpacing: '0.25em',
              color: 'rgba(141,175,116,0.8)',
            }}
          >
            {card.number}
          </span>
          <motion.span
            className="opacity-0 group-hover:opacity-100"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              color: '#8DAF74',
            }}
            initial={false}
            animate={{ rotate: 0 }}
            whileHover={{ x: 2, y: -2 }}
            transition={{ duration: 0.3 }}
          >
            ↗
          </motion.span>
        </div>

        {/* Bottom: title + description */}
        <div>
          {/* Thin divider */}
          <div
            className="mb-4 w-8 h-px origin-left transition-all duration-500 group-hover:w-16"
            style={{ background: 'linear-gradient(90deg, #5C8A63, #C9B26B)' }}
          />

          <h3
            className="display-section mb-2"
            style={{
              fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
              color: '#F5F3EC',
              fontStyle: 'italic',
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 300,
              letterSpacing: '0.06em',
              color: 'rgba(245,243,236,0.55)',
              lineHeight: 1.6,
            }}
          >
            {card.description}
          </p>

          {/* Arrow row */}
          <div
            className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.5625rem',
              letterSpacing: '0.22em',
              color: '#8DAF74',
              textTransform: 'uppercase',
            }}
          >
            EXPLORE
            <span style={{ fontSize: '0.75rem' }}>→</span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default function CuratedExperiences() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView   = useInView(sectionRef, { once: true, margin: '-10%' })

  return (
    <section
      ref={sectionRef}
      id="experiences"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="eyebrow mb-4">EXPERIENCES</p>
            <h2
              className="display-section"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                color: '#F5F3EC',
                fontStyle: 'italic',
              }}
            >
              Curated for those who seek
              <br />
              <em style={{ fontStyle: 'italic', color: '#C9B26B' }}>deeper connection.</em>
            </h2>
          </div>

          <a
            href="#experiences"
            className="hidden lg:inline-flex items-center gap-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 400,
              letterSpacing: '0.22em',
              color: 'rgba(245,243,236,0.45)',
              textTransform: 'uppercase',
              textDecoration: 'none',
              marginBottom: '0.5rem',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8DAF74')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,243,236,0.45)')}
          >
            VIEW ALL →
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="divider-botanical mt-8 origin-left"
        />
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 6%, 6rem)',
        }}
        className="max-md:grid-cols-2"
      >
        {EXPERIENCES.map((card, i) => (
          <ExperienceCard key={card.number} card={card} index={i} />
        ))}
      </div>
    </section>
  )
}
