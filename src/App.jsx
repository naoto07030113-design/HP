import { useState, useCallback, useEffect } from 'react'
import { useLenis } from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'
import MainScene from './components/scene/MainScene'
import Navigation from './components/ui/Navigation'
import HeroOverlay from './components/ui/HeroOverlay'
import SectionLabels from './components/ui/SectionLabels'
import ScrollProgress from './components/ui/ScrollProgress'
import ContactOverlay from './components/ui/ContactOverlay'
import LoadingScreen from './components/ui/LoadingScreen'

// Robust mobile detection — covers iPhone, iPad, small Android
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.innerWidth < 1024 ||
      /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent)
    )
  })

  useEffect(() => {
    const check = () =>
      setIsMobile(
        window.innerWidth < 1024 ||
        /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent)
      )
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const isMobile = useIsMobile()

  useLenis()
  const scrollRef = useScrollProgress()

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div style={{ background: '#111c10' }}>
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      <MainScene scrollRef={scrollRef} isMobile={isMobile} />

      <Navigation />
      <HeroOverlay />
      <SectionLabels scrollRef={scrollRef} />
      <ScrollProgress scrollRef={scrollRef} />
      <ContactOverlay />

      <div id="scroll-root" style={{ position: 'relative', zIndex: 10 }}>
        <section id="entrance"    style={{ height: '100vh', pointerEvents: 'none' }} />
        <section id="grand-hall"  style={{ height: '150vh', pointerEvents: 'none' }} />
        <section id="living-path" style={{ height: '150vh', pointerEvents: 'none' }} />
        <section id="cultivation" style={{ height: '150vh', pointerEvents: 'none' }} />
        <section id="reflection"  style={{ height: '130vh', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}
