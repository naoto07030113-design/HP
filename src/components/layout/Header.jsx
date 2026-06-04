import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'ダッシュボード',
  '/prospects': '見込み客一覧',
  '/prospects/': '見込み客詳細',
  '/kanban': '案件カンバン',
  '/import': 'CSVインポート',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path.endsWith('/') && path !== '/' ? pathname.startsWith(path) : pathname === path
  )?.[1] ?? 'ページ'

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded text-gray-400 hover:text-white hover:bg-surface-3 transition-colors"
        aria-label="メニューを開く"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <h1 className="text-sm font-semibold text-white flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
          <span className="text-gold text-xs font-medium">山</span>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">山田太郎</span>
      </div>
    </header>
  )
}
