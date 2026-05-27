import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'

gsap.registerPlugin(ScrollTrigger)

const ITEMS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    rotation: -3,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&q=80',
    rotation: 2,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    rotation: -2,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&q=80',
    rotation: 3,
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    rotation: -1,
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80',
    rotation: 2,
  },
]

const LEFT_COL = ITEMS.slice(0, 3)
const RIGHT_COL = ITEMS.slice(3, 6)

export default function Explorations() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the center content
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: contentRef.current,
        pinSpacing: false,
      })

      // Left column moves up
      gsap.fromTo(
        leftColRef.current,
        { y: 100 },
        {
          y: -200,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      )

      // Right column moves down
      gsap.fromTo(
        rightColRef.current,
        { y: -100 },
        {
          y: 200,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-[300vh] bg-bg">
      {/* Layer 1: Pinned center content */}
      <div
        ref={contentRef}
        className="relative z-10 h-screen flex items-center justify-center"
      >
        <div className="text-center px-6 max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-stroke" />
            <span className="text-xs text-muted uppercase tracking-[0.3em]">Explorations</span>
            <div className="w-8 h-px bg-stroke" />
          </div>
          <h2 className="text-3xl md:text-5xl font-body font-light text-text-primary mb-4">
            Visual <em className="font-display italic">playground</em>
          </h2>
          <p className="text-sm text-muted mb-8 max-w-xs mx-auto">
            A space for experimentation — type studies, motion tests, and creative explorations.
          </p>
          <a
            href="https://dribbble.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-stroke px-5 py-2.5 text-sm text-muted hover:text-text-primary transition-all duration-300 hover:border-transparent relative group"
          >
            <span className="absolute inset-[-1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient -z-10" />
            <span className="relative">View on Dribbble</span>
            <span className="relative">↗</span>
          </a>
        </div>
      </div>

      {/* Layer 2: Parallax columns */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="h-full flex items-center justify-center">
          <div className="w-full max-w-[1400px] mx-auto px-8 grid grid-cols-2 gap-12 md:gap-40 pointer-events-auto">
            {/* Left column */}
            <div ref={leftColRef} className="flex flex-col gap-6 pt-[30vh]">
              {LEFT_COL.map(item => (
                <button
                  key={item.id}
                  onClick={() => setLightboxSrc(item.image)}
                  className="block w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                  <img
                    src={item.image}
                    alt={`Exploration ${item.id}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>

            {/* Right column */}
            <div ref={rightColRef} className="flex flex-col gap-6 pb-[30vh] items-end">
              {RIGHT_COL.map(item => (
                <button
                  key={item.id}
                  onClick={() => setLightboxSrc(item.image)}
                  className="block w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                  <img
                    src={item.image}
                    alt={`Exploration ${item.id}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxSrc(null)}
          >
            <motion.img
              src={lightboxSrc}
              alt="Lightbox"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
