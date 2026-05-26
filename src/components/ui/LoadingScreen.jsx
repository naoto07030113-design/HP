import { useEffect, useRef, useState } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)
  const barRef = useRef()

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        if (c >= 100) { clearInterval(interval); return 100 }
        return Math.min(c + Math.floor(Math.random() * 10) + 3, 100)
      })
    }, 55)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${count}%`
    if (count >= 100) {
      setTimeout(() => {
        setFading(true)
        setTimeout(() => onComplete?.(), 700)
      }, 250)
    }
  }, [count, onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: '#FFFFFF',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Logo mark */}
      <div className="relative mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ border: '2px solid #E8EDE4' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ border: '1.5px solid #6AB628', animation: 'spin 3s linear infinite' }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: '#6AB628', boxShadow: '0 0 12px rgba(106,182,40,0.5)' }} />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="jp-text font-bold mb-1" style={{ fontSize: '1.1rem', color: '#1C2016', letterSpacing: '0.08em' }}>
        有限会社イトーメディカルケア
      </div>
      <div className="label-tag mb-8">Ito Medical Care Co., Ltd.</div>

      {/* Progress */}
      <div style={{ width: '160px', height: '2px', background: '#E8EDE4', borderRadius: '1px' }}>
        <div
          ref={barRef}
          style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, #6AB628, #A8D860)', borderRadius: '1px', transition: 'width 0.2s ease' }}
        />
      </div>
      <div className="jp-text mt-3" style={{ fontSize: '0.7rem', color: '#8A9280' }}>
        {count < 100 ? '読み込み中…' : '準備完了'}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
