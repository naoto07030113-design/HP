import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlog } from '../contexts/BlogContext.jsx'
import ArticleCard from '../components/blog/ArticleCard.jsx'

const STATUS_OPTIONS = [
  { value: 'all', label: '全て' },
  { value: 'published', label: '公開済み' },
  { value: 'draft', label: '下書き' },
  { value: 'scheduled', label: '予約投稿' },
  { value: 'archived', label: 'アーカイブ' },
]

export default function BlogList() {
  const navigate = useNavigate()
  const { articles, deleteArticle } = useBlog()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [viewMode, setViewMode] = useState('grid')
  const [selected, setSelected] = useState(new Set())

  const categories = useMemo(() => {
    const cats = [...new Set(articles.map(a => a.category).filter(Boolean))]
    return cats
  }, [articles])

  const filtered = useMemo(() => {
    let list = [...articles]
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter)
    if (categoryFilter !== 'all') list = list.filter(a => a.category === categoryFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      return new Date(b[sortBy] || b.createdAt) - new Date(a[sortBy] || a.createdAt)
    })
    return list
  }, [articles, statusFilter, categoryFilter, search, sortBy])

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkDelete() {
    if (selected.size === 0) return
    if (confirm(`${selected.size}件の記事を削除しますか？`)) {
      selected.forEach(id => deleteArticle(id))
      setSelected(new Set())
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">記事一覧</h1>
          <p className="text-sm text-gray-500 mt-0.5">全{articles.length}件</p>
        </div>
        <button
          onClick={() => navigate('/blog/editor')}
          className="bg-gold hover:bg-gold-dark text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>＋</span>新規作成
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="タイトル・タグで検索..."
            className="w-full bg-surface-3 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`text-xs px-3 py-1.5 transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-gold text-black font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-surface-3'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">全カテゴリ</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="createdAt">作成日順</option>
              <option value="updatedAt">更新日順</option>
              <option value="publishedAt">公開日順</option>
              <option value="title">タイトル順</option>
            </select>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-gold bg-gold-muted' : 'text-gray-500 hover:text-white'}`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-gold bg-gold-muted' : 'text-gray-500 hover:text-white'}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-surface-2 border border-gold/20 rounded-lg p-3 flex items-center gap-3">
          <span className="text-sm text-gold">{selected.size}件選択中</span>
          <button
            onClick={handleBulkDelete}
            className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1 rounded-lg transition-colors"
          >
            選択削除
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:text-white ml-auto"
          >
            選択解除
          </button>
        </div>
      )}

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm">該当する記事が見つかりません</div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-gold mt-2 hover:underline">
              検索をクリア
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(article => (
            <div key={article.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.has(article.id)}
                onChange={() => toggleSelect(article.id)}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <ArticleCard article={article} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
