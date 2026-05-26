import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HeroOverlay() {
  const containerRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade out entire hero as user scrolls into zone 1
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -40,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '#scroll-root',
          start: '10% top',
          end: '22% top',
          scrub: 1,
        },
      })

      gsap.fromTo(
        '.hero-tag',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.hero-title-line',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.4, delay: 0.6, stagger: 0.15, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.hero-sub',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.hero-divider',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 1.5, delay: 1, ease: 'power3.inOut' }
      )
      gsap.fromTo(
        '.hero-cta',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1.6, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.hero-jp',
        { opacity: 0 },
        { opacity: 1, duration: 1.5, delay: 1.8, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.scroll-indicator',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 1, delay: 2.2, ease: 'power3.out' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-center"
      style={{ padding: '0 8vw' }}
    >
      {/* Left vertical accent */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 hero-jp"
        style={{ opacity: 0 }}
      >
        <div className="writing-vertical jp-text text-white/20" style={{ fontSize: '0.7rem', letterSpacing: '0.3em' }}>
          未来の医療を体験する
        </div>
        <div className="w-px h-16" style={{ background: 'linear-gradient(180deg, transparent, rgba(201,168,76,0.4))' }} />
      </div>

      {/* Main content */}
      <div className="max-w-2xl">
        <div
          className="hero-tag label-tag mb-6 flex items-center gap-3"
          style={{ opacity: 0 }}
        >
          <div className="w-6 h-px" style={{ background: '#c9a84c' }} />
          Premium Healthcare · Japan
        </div>

        <h1 className="font-display leading-[1.0] mb-6">
          <div
            className="hero-title-line text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', opacity: 0, fontWeight: 400 }}
          >
            伊藤医療
          </div>
          <div
            className="hero-title-line"
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 3rem)',
              opacity: 0,
              fontWeight: 300,
              letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #e8e8e8 0%, #c9a84c 60%, #52b788 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginTop: '0.2em',
            }}
          >
            Ito Medical Care
          </div>
        </h1>

        <div
          className="hero-divider mb-6"
          style={{
            height: '1px',
            width: '200px',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.8), rgba(82,183,136,0.4), transparent)',
            opacity: 0,
          }}
        />

        <p
          className="hero-sub font-body text-white/50 font-light leading-relaxed mb-8"
          style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', maxWidth: '480px', opacity: 0 }}
        >
          地域の暮らしに、医療と福祉の安心を。
        </p>

        <div
          className="hero-cta flex items-center gap-4 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <button className="btn-glass">
            施設を探索する
          </button>
          <span className="text-white/30 font-body" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
            Scroll to explore ↓
          </span>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div
        className="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: 0 }}
      >
        <div className="label-tag" style={{ fontSize: '0.55rem' }}>Scroll</div>
        <div
          className="w-px h-10 overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.2)' }}
        >
          <div
            style={{
              width: '100%',
              height: '40%',
              background: 'linear-gradient(180deg, #c9a84c, transparent)',
              animation: 'scrollDown 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(250%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
