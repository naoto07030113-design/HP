import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface JourneyStep {
  number: string
  title: string
  description: string
  image: string
}

const STEPS: JourneyStep[] = [
  {
    number: '01',
    title: 'Enter the Canopy',
    description:
      'Pass through the grand glass arches into a world where natural light filters through ancient iron and modern crystal.',
    image:
      'https://images.unsplash.com/photo-1585015058898-9ef0e9a54c36?auto=format&fit=crop&w=1400&q=80',
  },
  {
    number: '02',
    title: 'The Cultivation Beds',
    description:
      'Rows of living cultivation — micro-greens, heirloom varieties, medicinal herbs. Touch the soil. Smell the earth.',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    number: '03',
    title: 'Fermentation Chambers',
    description:
      'Descend into the underground atelier where living cultures transform raw harvest into complex flavour and nutrition.',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    number: '04',
    title: 'The Living Table',
    description:
      'A seasonal table set with everything grown within these walls. Radical freshness. No distance between seed and plate.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80',
  },
  {
    number: '05',
    title: 'Dusk in the Garden',
    description:
      'As the golden hour arrives, the park reveals its quietest beauty. Stay. Linger. Return to what is essential.',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1400&q=80',
  },
]

export default function ScrollJourney() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const pinRef        = useRef<HTMLDivElement>(null)
  const imageWrapRef  = useRef<HTMLDivElement>(null)
  const textColRef    = useRef<HTMLDivElement>(null)
  const headerRef     = useRef<HTMLDivElement>(null)
  const isInView      = useInView(sectionRef, { once: true, margin: '-20%' })

  const [activeStep, setActiveStep] = useState(0)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const totalSteps = STEPS.length
      const stepHeight = window.innerHeight

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: `+=${stepHeight * (totalSteps - 1)}`,
          scrub: 1.2,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate(self) {
            const rawProgress = self.progress * (totalSteps - 1)
            const stepped = Math.round(rawProgress)
            setActiveStep(Math.min(Math.max(stepped, 0), totalSteps - 1))
          },
        },
      })

      /* Animate images: each image fades in from slight scale, previous fades out */
      const imgs = imageWrapRef.current?.querySelectorAll<HTMLDivElement>('.journey-img')
      if (imgs && imgs.length > 0) {
        imgs.forEach((img, i) => {
          if (i === 0) return
          tl.fromTo(
            img,
            { opacity: 0, scale: 1.04 },
            { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' },
            (i - 1) / (totalSteps - 1)
          )
        })
      }

      /* Animate text items */
      const textItems = textColRef.current?.querySelectorAll<HTMLDivElement>('.journey-text-item')
      if (textItems && textItems.length > 0) {
        textItems.forEach((item, i) => {
          if (i === 0) return
          tl.fromTo(
            item,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
            (i - 1) / (totalSteps - 1)
          )
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const fade = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  return (
    <section
      ref={sectionRef}
      id="journey"
      style={{ background: '#111B11' }}
    >
      {/* Section header — outside the pinned area */}
      <div
        ref={headerRef}
        style={{
          paddingTop: 'clamp(5rem, 8vw, 9rem)',
          paddingBottom: '3rem',
          paddingLeft: 'clamp(2rem, 6%, 6rem)',
          paddingRight: 'clamp(2rem, 6%, 6rem)',
        }}
      >
        <motion.p
          custom={0}
          variants={fade}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="eyebrow mb-4"
        >
          JOURNEY
        </motion.p>
        <motion.div
          custom={1}
          variants={fade}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="divider-botanical"
          style={{ width: '80px' }}
        />
      </div>

      {/* Pinned viewport */}
      <div
        ref={pinRef}
        style={{
          height: '100svh',
          minHeight: '640px',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* LEFT 40% — text column */}
        <div
          ref={textColRef}
          style={{
            width: '40%',
            minWidth: '300px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 'clamp(2rem, 6%, 6rem)',
            paddingRight: '3rem',
            paddingTop: '2rem',
            paddingBottom: '2rem',
            background: '#111B11',
            zIndex: 2,
          }}
        >
          {/* Static heading */}
          <h2
            className="display-section mb-6"
            style={{
              fontSize: 'clamp(1.8rem, 3.2vw, 3rem)',
              color: '#F5F3EC',
              fontStyle: 'normal',
            }}
          >
            Walk Through the{' '}
            <em
              className="display-section"
              style={{ fontStyle: 'italic', fontSize: 'inherit', color: '#C9B26B' }}
            >
              Living
            </em>{' '}
            Editorial
          </h2>

          {/* Static body */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 300,
              letterSpacing: '0.02em',
              lineHeight: 1.75,
              color: 'rgba(245,243,236,0.55)',
              maxWidth: '380px',
              marginBottom: '2.5rem',
            }}
          >
            Each space within BIO PARK tells a different chapter of the same story — the
            ancient, unbroken relationship between humans and living systems.
          </p>

          {/* Scroll text link */}
          <a
            href="#philosophy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.22em',
              color: '#8DAF74',
              textTransform: 'uppercase',
              textDecoration: 'none',
              marginBottom: '3.5rem',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9B26B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8DAF74')}
          >
            SCROLL TO JOURNEY
            <span style={{ transition: 'transform 0.3s ease' }}>→</span>
          </a>

          {/* Dynamic text items (stacked, shown via GSAP opacity) */}
          <div style={{ position: 'relative', height: '120px' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="journey-text-item"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: i === 0 ? 1 : 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.6rem',
                    letterSpacing: '0.28em',
                    color: '#8DAF74',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  {step.number} / {step.title}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 300,
                    letterSpacing: '0.02em',
                    lineHeight: 1.7,
                    color: 'rgba(245,243,236,0.6)',
                    maxWidth: '320px',
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 60% — image + sidebar */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Image layers */}
          <div ref={imageWrapRef} style={{ position: 'absolute', inset: 0 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="journey-img"
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: i === 0 ? 1 : 0,
                }}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                  decoding="async"
                />
                {/* Vignette */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to left, rgba(17,27,17,0.0) 60%, rgba(17,27,17,0.6) 100%)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Far-right vertical progress sidebar */}
          <div
            style={{
              position: 'absolute',
              right: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
              zIndex: 10,
            }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Number dot */}
                <button
                  onClick={() => {
                    /* on click, would jump scroll but simplest is just visual */
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  aria-label={`Step ${step.number}`}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.5rem',
                      letterSpacing: '0.2em',
                      color: activeStep === i ? '#F5F3EC' : 'rgba(245,243,236,0.25)',
                      transition: 'color 0.4s ease',
                      fontWeight: activeStep === i ? 600 : 300,
                    }}
                  >
                    {step.number}
                  </span>
                  {/* Dot */}
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: activeStep === i ? '#8DAF74' : 'rgba(141,175,116,0.2)',
                      transition: 'background 0.4s ease, transform 0.4s ease',
                      transform: activeStep === i ? 'scale(1.5)' : 'scale(1)',
                    }}
                  />
                </button>

                {/* Connecting line between dots (not after last) */}
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: '1px',
                      height: '28px',
                      background: 'rgba(141,175,116,0.15)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
