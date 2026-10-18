export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-8 w-8 text-matcha-800" aria-hidden>
        <path d="M6 33C5 18 15 7 34 6c1 17-10 28-28 27z" fill="currentColor" />
        <path d="M8 31C14 22 21 15 30 10" stroke="#eaf59a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
      <div className="leading-none">
        <p className="font-caps text-[13px] font-semibold tracking-[0.28em] text-matcha-950">MATCHA MOOD</p>
        <p className="mt-1 font-caps text-[8.5px] tracking-[0.3em] text-matcha-900/70">JAPANESE MATCHA CAFE</p>
      </div>
    </div>
  )
}
