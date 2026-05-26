import { useRef, useState, useCallback } from 'react'
import { useLenis } from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'
import MainScene from './components/scene/MainScene'
import Navigation from './components/ui/Navigation'
import HeroOverlay from './components/ui/HeroOverlay'
import SectionLabels from './components/ui/SectionLabels'
import ScrollProgress from './components/ui/ScrollProgress'
import ContactOverlay from './components/ui/ContactOverlay'
import LoadingScreen from './components/ui/LoadingScreen'

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useLenis()
  const scrollRef = useScrollProgress()

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div style={{ background: '#080d0b' }}>
      {/* Loading screen */}
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* Fixed 3D canvas — always behind everything */}
      <MainScene scrollRef={scrollRef} />

      {/* Fixed UI layer */}
      <Navigation scrollRef={scrollRef} />
      <HeroOverlay />
      <SectionLabels />
      <ScrollProgress scrollRef={scrollRef} />
      <ContactOverlay />

      {/* Scrollable container that drives camera animation */}
      {/* Sections are transparent — they only exist to create scroll distance */}
      <div id="scroll-root" style={{ position: 'relative', zIndex: 10 }}>
        {/* Hero */}
        <section
          id="hero"
          style={{ height: '100vh', pointerEvents: 'none' }}
        />

        {/* Zone 1 — Acupuncture */}
        <section
          id="acupuncture"
          style={{ height: '120vh', pointerEvents: 'none' }}
        />

        {/* Zone 2 — Rehab */}
        <section
          id="rehab"
          style={{ height: '120vh', pointerEvents: 'none' }}
        />

        {/* Zone 3 — Group Home */}
        <section
          id="grouphome"
          style={{ height: '120vh', pointerEvents: 'none' }}
        />

        {/* Zone 4 — BIO PARK */}
        <section
          id="biopark"
          style={{ height: '120vh', pointerEvents: 'none' }}
        />

        {/* Contact */}
        <section
          id="contact"
          style={{ height: '100vh', pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}
