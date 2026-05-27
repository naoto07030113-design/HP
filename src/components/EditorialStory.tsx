import { useLayoutEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STORY_IMAGE =
  'https://images.unsplash.com/photo-1585015058898-9ef0e9a54c36?auto=format&fit=crop&w=1920&q=80'

export default function EditorialStory() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imgRef     = useRef<HTMLDivElement>(null)
  const isInView   = useInView(sectionRef, { once: true, margin: '-15%' })

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const fade = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1.1, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  return (
    <section
      ref={sectionRef}
      id="vision"
      className="relative overflow-hidden"
      style={{ minHeight: '85vh' }}
    >
      {/* Background photo */}
      <div
        ref={imgRef}
        className="absolute inset-0 w-full"
        style={{ height: '115%', top: '-7.5%' }}
      >
        <img
          src={STORY_IMAGE}
          alt="Greenhouse interior"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Overlay — slightly different angle than hero */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(11,19,11,0.92) 0%, rgba(11,19,11,0.72) 55%, rgba(11,19,11,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex items-center min-h-[85vh]"
        style={{
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 12%, 12rem)',
          paddingTop: '7rem',
          paddingBottom: '7rem',
        }}
      >
        <div style={{ maxWidth: '720px' }}>
          {/* Eyebrow */}
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="eyebrow mb-8"
          >
            OUR STORY
          </motion.p>

          {/* H2 */}
          <motion.h2
            custom={1}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="display-section mb-8"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
              color: '#F5F3EC',
              fontStyle: 'normal',
            }}
          >
            A new relationship between people{' '}
            <br className="hidden md:block" />
            and{' '}
            <em
              className="display-section"
              style={{
                fontStyle: 'italic',
                fontSize: 'inherit',
                color: '#F5F3EC',
              }}
            >
              living systems.
            </em>
          </motion.h2>

          {/* Divider */}
          <motion.div
            custom={2}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="divider-botanical mb-8"
            style={{ width: '120px' }}
          />

          {/* Body */}
          <motion.p
            custom={3}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="body-editorial mb-10"
            style={{
              fontSize: '0.9375rem',
              maxWidth: '520px',
              color: 'rgba(245,243,236,0.65)',
            }}
          >
            BIO PARK is more than a destination — it is a living manifesto. Born from a belief
            that the modern human is deeply disconnected from the systems that sustain them, we
            have cultivated a space where science, ecology, and culture converge. Every pathway,
            every harvest, every fermentation chamber is a portal back to what is essential.
          </motion.p>

          {/* Text link */}
          <motion.a
            custom={4}
            variants={fade}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            href="#vision"
            className="inline-flex items-center gap-3 group"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.22em',
              color: '#8DAF74',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            LEARN MORE ABOUT OUR VISION
            <span
              className="transition-transform duration-300 group-hover:translate-x-1"
              style={{ fontSize: '0.75rem' }}
            >
              →
            </span>
            <span
              className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px transition-all duration-500"
              style={{ background: '#8DAF74' }}
            />
          </motion.a>
        </div>
      </div>
    </section>
  )
}
