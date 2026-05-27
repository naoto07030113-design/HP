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

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useLenis()
  const scrollRef = useScrollProgress()

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div style={{ background: '#1a2e18' }}>
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* Fixed 3D canvas — always fills viewport */}
      <MainScene scrollRef={scrollRef} />

      {/* Fixed UI layer */}
      <Navigation />
      <HeroOverlay />
      <SectionLabels scrollRef={scrollRef} />
      <ScrollProgress scrollRef={scrollRef} />
      <ContactOverlay />

      {/*
        Transparent scroll container — provides scroll height only.
        Camera animation is driven by scroll progress.
      */}
      <div id="scroll-root" style={{ position: 'relative', zIndex: 10 }}>
        {/* Scene 1 — Greenhouse Entrance */}
        <section id="entrance" style={{ height: '100vh', pointerEvents: 'none' }} />

        {/* Scene 2 — Grand Central Conservatory */}
        <section id="grand-hall" style={{ height: '150vh', pointerEvents: 'none' }} />

        {/* Scene 3 — The Living Path */}
        <section id="living-path" style={{ height: '150vh', pointerEvents: 'none' }} />

        {/* Scene 4 — Cultivation & Harvest */}
        <section id="cultivation" style={{ height: '150vh', pointerEvents: 'none' }} />

        {/* Scene 5 — Reflection Hall */}
        <section id="reflection" style={{ height: '130vh', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}
