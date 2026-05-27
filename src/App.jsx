import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useCallback } from 'react'

import { useLenis } from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'
import MainScene from './components/scene/MainScene'
import Navigation from './components/ui/Navigation'
import HeroOverlay from './components/ui/HeroOverlay'
import ScrollProgress from './components/ui/ScrollProgress'
import ContactOverlay from './components/ui/ContactOverlay'
import LoadingScreen from './components/ui/LoadingScreen'
import { ZoneDisplay, ZONES } from './components/ui/ZoneDisplay'

import HoninPage from './pages/HoninPage'
import StretchPage from './pages/StretchPage'
import SanriPage from './pages/SanriPage'
import RehaPage from './pages/RehaPage'

function HomePage() {
  const [loaded, setLoaded] = useState(false)
  useLenis()
  const scrollRef = useScrollProgress()
  const handleLoad = useCallback(() => setLoaded(true), [])

  return (
    <div style={{ background: '#EDECEA' }}>
      {!loaded && <LoadingScreen onComplete={handleLoad} />}

      {/* Fixed 3D canvas */}
      <MainScene scrollRef={scrollRef} />

      {/* Fixed UI overlays */}
      <Navigation />
      <HeroOverlay />
      <ScrollProgress scrollRef={scrollRef} />

      {/* Zone info strips — one per clinic zone */}
      {ZONES.map((zone) => (
        <ZoneDisplay
          key={zone.path}
          zone={zone}
          triggerStart={zone.triggerStart}
          triggerEnd={zone.triggerEnd}
        />
      ))}

      <ContactOverlay />

      {/* Scrollable spacer — drives camera + ScrollTrigger */}
      <div id="scroll-root" style={{ position: 'relative', zIndex: 10 }}>
        <section id="hero"        style={{ height: '100vh',  pointerEvents: 'none' }} />
        <section id="acupuncture" style={{ height: '120vh', pointerEvents: 'none' }} />
        <section id="stretch"     style={{ height: '120vh', pointerEvents: 'none' }} />
        <section id="sanri"       style={{ height: '120vh', pointerEvents: 'none' }} />
        <section id="reha"        style={{ height: '120vh', pointerEvents: 'none' }} />
        <section id="contact"     style={{ height: '100vh', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<HomePage />} />
        <Route path="/honin"   element={<HoninPage />} />
        <Route path="/stretch" element={<StretchPage />} />
        <Route path="/sanri"   element={<SanriPage />} />
        <Route path="/reha"    element={<RehaPage />} />
      </Routes>
    </BrowserRouter>
  )
}
