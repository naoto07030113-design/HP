import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    const tween = gsap.to(progress, {
      current: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#scroll-root',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        onUpdate: (self) => {
          progress.current = self.progress
        },
      },
    })

    return () => {
      tween.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return progress
}
