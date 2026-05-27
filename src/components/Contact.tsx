import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Hls from 'hls.js'

const HLS_SRC = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8'

const SOCIALS = [
  { name: 'Twitter', href: '#' },
  { name: 'LinkedIn', href: '#' },
  { name: 'Dribbble', href: '#' },
  { name: 'GitHub', href: '#' },
]

const MARQUEE_TEXT = 'BUILDING THE FUTURE • '

export default function Contact() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)

  // HLS video setup
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(HLS_SRC)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SRC
    }
  }, [])

  // GSAP Marquee
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!marqueeRef.current) return
      gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 40,
        ease: 'none',
        repeat: -1,
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" className="bg-bg pt-16 md:pt-20 pb-8 md:pb-12 overflow-hidden">
      {/* Background video */}
      <div className="relative h-[70vh] md:h-[80vh] mb-16 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2 scale-y-[-1]"
        />
        {/* Heavy overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Marquee */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 overflow-hidden py-4">
          <div className="flex whitespace-nowrap">
            <div
              ref={marqueeRef}
              className="flex whitespace-nowrap"
              style={{ width: 'max-content' }}
            >
              {Array(20).fill(MARQUEE_TEXT).map((text, i) => (
                <span
                  key={i}
                  className="text-4xl md:text-6xl lg:text-8xl font-display italic text-white/10 px-4"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
          <p className="text-xs text-muted uppercase tracking-[0.3em] mb-6">Let's work together</p>
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-display italic text-text-primary mb-10 leading-tight">
            Let's build<br />something great.
          </h2>
          <a
            href="mailto:hello@michaelsmith.com"
            className="relative group rounded-full text-sm md:text-base px-8 py-4 border-2 border-stroke bg-bg/50 text-text-primary hover:scale-105 transition-all duration-300 backdrop-blur-sm"
          >
            <span className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient -z-10" />
            <span className="relative">hello@michaelsmith.com ↗</span>
          </a>
        </div>
      </div>

      {/* Footer bar */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-stroke">
          {/* Social links */}
          <div className="flex items-center gap-6">
            {SOCIALS.map(social => (
              <a
                key={social.name}
                href={social.href}
                className="text-xs text-muted uppercase tracking-[0.15em] hover:text-text-primary transition-colors duration-200"
              >
                {social.name}
              </a>
            ))}
          </div>

          {/* Available badge */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
            />
            <span className="text-xs text-muted uppercase tracking-[0.15em]">Available for projects</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-muted/50 mt-8">
          © {new Date().getFullYear()} Michael Smith. All rights reserved.
        </p>
      </div>
    </section>
  )
}
