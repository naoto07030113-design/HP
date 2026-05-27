import { useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Works from './components/Works'
import Journal from './components/Journal'
import Explorations from './components/Explorations'
import Stats from './components/Stats'
import Contact from './components/Contact'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="bg-bg text-text-primary min-h-screen overflow-x-hidden">
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      {!isLoading && (
        <>
          <Navbar />
          <main>
            <Hero />
            <Works />
            <Journal />
            <Explorations />
            <Stats />
            <Contact />
          </main>
        </>
      )}
    </div>
  )
}
