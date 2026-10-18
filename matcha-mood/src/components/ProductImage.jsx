import { useState } from 'react'

// 画像が無い・読み込めない場合は、実物と誤認させないよう「仮素材」と明示したプレースホルダーを表示
export default function ProductImage({ src, alt, className = '', imgClassName = '', compact = false, ...rest }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}（画像未提供・仮素材）`}
        className={`flex flex-col items-center justify-center gap-1 border border-dashed border-matcha-700/40 bg-[repeating-linear-gradient(135deg,rgba(63,111,34,0.06)_0_8px,transparent_8px_16px)] text-center text-matcha-800/70 ${className}`}
        {...rest}
      >
        <svg viewBox="0 0 24 24" className={compact ? 'h-4 w-4' : 'h-7 w-7'} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 16l5-5 4 4 3-3 6 6" />
        </svg>
        <span className={`font-caps tracking-[0.15em] ${compact ? 'text-[8px]' : 'text-[10px]'}`}>仮素材</span>
        {!compact && <span className="text-[10px] leading-tight">画像未提供</span>}
      </div>
    )
  }

  return (
    <div className={`overflow-hidden ${className}`} {...rest}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className={`h-full w-full select-none object-cover ${imgClassName}`}
      />
    </div>
  )
}
