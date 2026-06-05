import { NavLink } from 'react-router-dom'
import { useProspects } from '../../contexts/ProspectContext.jsx'

const NAV = [
  { to: '/', label: 'ダッシュボード', icon: DashIcon, exact: true },
  { to: '/prospects', label: '見込み客一覧', icon: PeopleIcon },
  { to: '/kanban', label: '案件カンバン', icon: KanbanIcon },
  { to: '/import', label: 'CSVインポート', icon: ImportIcon },
]

export default function Sidebar({ open, onClose }) {
  const { prospects } = useProspects()
  const activeCount = prospects.filter(p => p.status === '営業中' || p.status === '返信あり' || p.status === '商談').length

  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-surface border-r border-border z-40
          flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gold flex items-center justify-center">
              <span className="text-black text-xs font-bold">AI</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">営業自動運転</div>
              <div className="text-xs text-gold leading-tight">Sales AI</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gold-muted text-gold border border-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-surface-3'
                }`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom stats */}
        <div className="px-4 py-4 border-t border-border">
          <div className="text-xs text-gray-600 mb-2">アクティブ案件</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-border rounded-full h-1.5">
              <div
                className="bg-gold h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((activeCount / prospects.length) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gold font-medium">{activeCount}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">/ {prospects.length} 件</div>
        </div>
      </aside>
    </>
  )
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 14c0-2.761 2.239-5 5-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.5 15c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function KanbanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="6" y="1" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="1" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v9M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
