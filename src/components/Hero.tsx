import { useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  isLoaded: boolean
}

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1585015058898-9ef0e9a54c36?auto=format&fit=crop&w=1920&q=80'
const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1920&q=80'

export default function Hero({ isLoaded }: HeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imgRef     = useRef<HTMLDivElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)

  /* Parallax on scroll */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const textVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.1,
        delay: i * 0.15,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: '680px' }}
    >
      {/* ── Background photo ── */}
      <div
        ref={imgRef}
        className="absolute inset-0 w-full"
        style={{ height: '115%', top: '-7.5%' }}
      >
        <img
          src={HERO_IMAGE}
          onError={e => { (e.currentTarget as HTMLImageElement).src = HERO_FALLBACK }}
          alt="Victorian greenhouse interior with golden light"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* ── Dark gradient overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(11,19,11,0.88) 0%, rgba(11,19,11,0.60) 50%, rgba(11,19,11,0.32) 100%)',
        }}
      />

      {/* ── Bottom vignette for smooth transition ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(11,19,11,0.95))',
        }}
      />

      {/* ── Hero text content — left aligned ── */}
      <div
        ref={textRef}
        className="relative z-10 flex flex-col justify-center h-full"
        style={{ paddingLeft: 'clamp(2rem, 6%, 6rem)', maxWidth: '780px' }}
      >
        {/* Eyebrow */}
        <motion.p
          custom={0}
          variants={textVariants}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className="eyebrow mb-6"
        >
          BIO PARK
        </motion.p>

        {/* H1 */}
        <motion.h1
          custom={1}
          variants={textVariants}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className="display-hero mb-6"
          style={{
            fontSize: 'clamp(3.2rem, 7.5vw, 7rem)',
            color: '#F5F3EC',
          }}
        >
          Where Nature
          <br />
          <em style={{ fontStyle: 'italic', color: '#F5F3EC' }}>Becomes Experience</em>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          custom={2}
          variants={textVariants}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className="body-editorial mb-10"
          style={{
            fontSize: '0.9375rem',
            maxWidth: '440px',
            color: 'rgba(245,243,236,0.72)',
          }}
        >
          A living destination where cultivation, fermentation, and human connection grow
          together.
        </motion.p>

        {/* Buttons */}
        <motion.div
          custom={3}
          variants={textVariants}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className="flex flex-wrap items-center gap-4"
        >
          <a href="#experiences" className="btn-primary" style={{ textDecoration: 'none' }}>
            EXPLORE THE PARK →
          </a>
          <a href="#vision" className="btn-ghost" style={{ textDecoration: 'none' }}>
            DISCOVER THE STORY
          </a>
        </motion.div>
      </div>

      {/* ── Scroll indicator — bottom left ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 1.4 }}
        className="absolute bottom-8 left-0 flex items-center gap-4"
        style={{ paddingLeft: 'clamp(2rem, 6%, 6rem)' }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.5625rem',
            letterSpacing: '0.35em',
            color: 'rgba(245,243,236,0.45)',
            textTransform: 'uppercase',
          }}
        >
          SCROLL
        </span>
        <div
          className="relative overflow-hidden"
          style={{ width: '48px', height: '1px', background: 'rgba(245,243,236,0.18)' }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ background: 'linear-gradient(90deg, #5C8A63, #C9B26B)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
          />
        </div>
      </motion.div>
    </section>
  )
}
