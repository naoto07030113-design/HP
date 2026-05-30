import { useState, useCallback } from 'react'
import { useLenis } from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'
import MainScene from './components/scene/MainScene'
import Navigation from './components/ui/Navigation'
import HeroOverlay from './components/ui/HeroOverlay'
import SectionLabels from './components/ui/SectionLabels'
import ScrollProgress from './components/ui/ScrollProgress'
import ContactOverlay from './components/ui/ContactOverlay'
import LoadingScreen from './components/ui/LoadingScreen'

// RESTAURANT EXPERIENCE — replaces previous greenhouse project

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useLenis()
  const scrollRef = useScrollProgress()

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div style={{ background: '#0d0602' }}>
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* Fixed 3D canvas — fills viewport */}
      <MainScene scrollRef={scrollRef} />

      {/* Fixed UI layer */}
      <Navigation />
      <HeroOverlay />
      <SectionLabels scrollRef={scrollRef} />
      <ScrollProgress scrollRef={scrollRef} />
      <ContactOverlay />

      {/* Transparent scroll container — scroll height drives camera animation */}
      <div id="scroll-root" style={{ position: 'relative', zIndex: 10 }}>
        {/* Section 1 — Exterior Terrace */}
        <section id="entrance" style={{ height: '120vh', pointerEvents: 'none' }} />

        {/* Section 2 — Entrance + Main Dining */}
        <section id="dining" style={{ height: '150vh', pointerEvents: 'none' }} />

        {/* Section 3 — Cantina Corridor */}
        <section id="cantina" style={{ height: '130vh', pointerEvents: 'none' }} />

        {/* Section 4 — Private Dining Room */}
        <section id="contact" style={{ height: '150vh', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}
