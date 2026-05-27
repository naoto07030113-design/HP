import { useState, useCallback, useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import LoadingScreen  from './components/LoadingScreen'
import Navigation     from './components/Navigation'
import Hero           from './components/Hero'
import EditorialStory from './components/EditorialStory'
import CuratedExperiences from './components/CuratedExperiences'
import ScrollJourney  from './components/ScrollJourney'
import Philosophy     from './components/Philosophy'
import Partnership    from './components/Partnership'
import Visit          from './components/Visit'
import Footer         from './components/Footer'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  /* ── Lenis smooth scroll wired into GSAP ticker ── */
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  /* ── Refresh ScrollTrigger after loading overlay exits ── */
  const handleLoadComplete = useCallback(() => {
    setIsLoaded(true)
    setTimeout(() => ScrollTrigger.refresh(), 120)
  }, [])

  return (
    <>
      {!isLoaded && <LoadingScreen onComplete={handleLoadComplete} />}

      <Navigation />

      <main>
        <Hero            isLoaded={isLoaded} />
        <EditorialStory  />
        <CuratedExperiences />
        <ScrollJourney   />
        <Philosophy      />

        {/* Partnership + Visit sit side-by-side, each exactly 50% */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: '0 0 50%', overflow: 'hidden' }}>
            <Partnership />
          </div>
          <div style={{ flex: '0 0 50%', overflow: 'hidden' }}>
            <Visit />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
