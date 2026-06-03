import { useClock } from '../hooks/useClock'

export default function StatusBar() {
  const time = useClock()
  const h = time.getHours().toString().padStart(2, '0')
  const m = time.getMinutes().toString().padStart(2, '0')

  return (
    <div className="sb">
      <span className="sb-time">{h}:{m}</span>
      <div className="sb-icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="white" opacity="0.9">
          <rect x="0" y="5" width="3" height="6" rx="0.5"/>
          <rect x="4" y="3" width="3" height="8" rx="0.5"/>
          <rect x="8" y="1" width="3" height="10" rx="0.5"/>
          <rect x="12" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="white" opacity="0.9">
          <path d="M7.5 2.5a7 7 0 0 1 5 2.1L11 6.2A5 5 0 0 0 7.5 4.5a5 5 0 0 0-3.5 1.7L2.5 4.6a7 7 0 0 1 5-2.1z"/>
          <path d="M7.5 5.5a4 4 0 0 1 2.8 1.1L9 8.1A2 2 0 0 0 7.5 7.5a2 2 0 0 0-1.5.6L4.7 6.6A4 4 0 0 1 7.5 5.5z"/>
          <circle cx="7.5" cy="9.5" r="1.5"/>
        </svg>
        <div className="sb-battery">
          <div className="sb-battery-body">
            <div className="sb-battery-fill"/>
          </div>
          <div className="sb-battery-nub"/>
        </div>
      </div>
    </div>
  )
}
