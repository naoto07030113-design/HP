import { useEffect, useState } from 'react'

const NAV_LINKS = ['Home', 'Work', 'Resume']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('Home')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div
        className={`inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-2 py-2 transition-shadow duration-300 ${
          scrolled ? 'shadow-md shadow-black/10' : ''
        }`}
      >
        {/* Logo */}
        <button
          className="relative w-9 h-9 rounded-full flex items-center justify-center group transition-transform duration-300 hover:scale-110"
          aria-label="Home"
          onClick={() => setActive('Home')}
        >
          {/* Gradient ring */}
          <span className="absolute inset-0 rounded-full accent-gradient p-[1.5px] group-hover:[background:linear-gradient(270deg,#4E85BF_0%,#89AACC_100%)] transition-all duration-500">
            <span className="block w-full h-full rounded-full bg-bg" />
          </span>
          <span className="relative z-10 font-display italic text-[13px] text-text-primary">JA</span>
        </button>

        {/* Divider */}
        <span className="hidden sm:block w-px h-5 bg-stroke mx-1" />

        {/* Nav links */}
        {NAV_LINKS.map(link => (
          <button
            key={link}
            onClick={() => setActive(link)}
            className={`text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 ${
              active === link
                ? 'text-text-primary bg-stroke/50'
                : 'text-muted hover:text-text-primary hover:bg-stroke/50'
            }`}
          >
            {link}
          </button>
        ))}

        {/* Divider */}
        <span className="hidden sm:block w-px h-5 bg-stroke mx-1" />

        {/* Say hi button */}
        <a
          href="mailto:hello@michaelsmith.com"
          className="relative group rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 text-muted hover:text-text-primary transition-colors duration-200"
        >
          {/* Gradient border on hover */}
          <span className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient -z-10" />
          <span className="relative z-10 flex items-center gap-1 bg-surface rounded-full px-3 sm:px-4 py-1.5 sm:py-2 -mx-3 -my-1.5 sm:-mx-4 sm:-my-2 backdrop-blur-md">
            Say hi
            <span className="text-[10px]">↗</span>
          </span>
        </a>
      </div>
    </nav>
  )
}
