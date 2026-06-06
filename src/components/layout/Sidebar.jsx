import { NavLink } from 'react-router-dom'
import { useProspects } from '../../contexts/ProspectContext.jsx'
import { useBlog } from '../../contexts/BlogContext.jsx'
import { useHP } from '../../contexts/HPContext.jsx'

const SALES_NAV = [
  { to: '/', label: 'ダッシュボード', icon: DashIcon, exact: true },
  { to: '/prospects', label: '見込み客一覧', icon: PeopleIcon },
  { to: '/kanban', label: '案件カンバン', icon: KanbanIcon },
  { to: '/import', label: 'CSVインポート', icon: ImportIcon },
]

const BLOG_NAV = [
  { to: '/blog', label: 'ブログ管理', icon: BlogIcon, exact: true },
  { to: '/blog/editor', label: '新規記事作成', icon: EditIcon },
  { to: '/blog/articles', label: '記事一覧', icon: ListIcon },
  { to: '/blog/settings', label: 'ブログ設定', icon: SettingsIcon },
]

const HP_NAV = [
  { to: '/hp', label: 'HP管理', icon: HPIcon, exact: true },
  { to: '/hp/editor/company', label: '会社HP編集', icon: EditIcon },
]

export default function Sidebar({ open, onClose }) {
  const { prospects } = useProspects()
  const { articles } = useBlog()
  const { clinics } = useHP()
  const activeCount = prospects.filter(p => p.status === '営業中' || p.status === '返信あり' || p.status === '商談').length
  const todaysArticle = articles.find(a => new Date(a.createdAt).toDateString() === new Date().toDateString())
  const publishedClinics = clinics.filter(c => c.status === 'published').length

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

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
              <div className="text-sm font-semibold text-white leading-tight">鍼灸院 AI管理</div>
              <div className="text-xs text-gold leading-tight">Acupuncture AI</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {/* Sales section */}
          <div className="text-xs text-gray-600 px-3 py-2 mt-1">営業管理</div>
          {SALES_NAV.map(({ to, label, icon: Icon, exact }) => (
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

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Blog section */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-gray-600">鍼灸ブログ</span>
            {!todaysArticle && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">
                未作成
              </span>
            )}
          </div>
          {BLOG_NAV.map(({ to, label, icon: Icon, exact }) => (
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
              {to === '/blog' && articles.length > 0 && (
                <span className="ml-auto text-xs text-gray-600">{articles.length}</span>
              )}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* HP section */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-gray-600">HP管理</span>
            {publishedClinics > 0 && (
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                {publishedClinics}院公開中
              </span>
            )}
          </div>
          {HP_NAV.map(({ to, label, icon: Icon, exact }) => (
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
              {to === '/hp' && clinics.length > 0 && (
                <span className="ml-auto text-xs text-gray-600">{clinics.length}院</span>
              )}
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
                style={{ width: `${Math.min((activeCount / Math.max(prospects.length, 1)) * 100, 100)}%` }}
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

function BlogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 6h8M4 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 4h9M5 8h9M5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="2" cy="4" r="1" fill="currentColor"/>
      <circle cx="2" cy="8" r="1" fill="currentColor"/>
      <circle cx="2" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

function HPIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1.5 8h13M8 1.5C6 4 5 6 5 8s1 4 3 6.5M8 1.5C10 4 11 6 11 8s-1 4-3 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
