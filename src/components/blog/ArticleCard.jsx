import { useNavigate } from 'react-router-dom'
import { useBlog } from '../../contexts/BlogContext.jsx'

const STATUS_CONFIG = {
  draft:     { label: '下書き',   color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  published: { label: '公開済み', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  scheduled: { label: '予約投稿', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  archived:  { label: 'アーカイブ', color: 'text-gray-600 bg-gray-600/10 border-gray-600/20' },
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ArticleCard({ article, compact = false }) {
  const navigate = useNavigate()
  const { deleteArticle, publishArticle, unpublishArticle } = useBlog()
  const status = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft

  function handleDelete(e) {
    e.stopPropagation()
    if (confirm(`「${article.title}」を削除しますか？`)) {
      deleteArticle(article.id)
    }
  }

  function handleTogglePublish(e) {
    e.stopPropagation()
    if (article.status === 'published') {
      unpublishArticle(article.id)
    } else {
      publishArticle(article.id)
    }
  }

  if (compact) {
    return (
      <div
        onClick={() => navigate(`/blog/editor/${article.id}`)}
        className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border hover:border-border-light cursor-pointer transition-all group"
      >
        {article.photos?.[0] && (
          <img
            src={article.photos[0].data}
            alt=""
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{article.title}</div>
          <div className="text-xs text-gray-500">{formatDate(article.createdAt)}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color} flex-shrink-0`}>
          {status.label}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden hover:border-border-light transition-all group">
      {article.photos?.[0] ? (
        <div
          className="h-40 overflow-hidden cursor-pointer"
          onClick={() => navigate(`/blog/editor/${article.id}`)}
        >
          <img
            src={article.photos[0].data}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div
          className="h-40 bg-surface-3 flex items-center justify-center cursor-pointer"
          onClick={() => navigate(`/blog/editor/${article.id}`)}
        >
          <div className="text-center">
            <div className="text-3xl mb-1">📝</div>
            <div className="text-xs text-gray-600">画像なし</div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color} flex-shrink-0`}>
            {status.label}
          </span>
          {article.aiGenerated && (
            <span className="text-xs px-2 py-0.5 rounded-full border text-gold border-gold/20 bg-gold-muted flex-shrink-0">
              AI生成
            </span>
          )}
        </div>

        <h3
          className="text-sm font-semibold text-white mb-2 line-clamp-2 cursor-pointer hover:text-gold transition-colors"
          onClick={() => navigate(`/blog/editor/${article.id}`)}
        >
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-1 flex-wrap mb-3">
          {article.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-gray-500 bg-surface-3 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {formatDate(article.publishedAt || article.createdAt)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/blog/editor/${article.id}`)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-3 rounded transition-colors"
              title="編集"
            >
              <EditIcon />
            </button>
            <button
              onClick={handleTogglePublish}
              className={`p-1.5 rounded transition-colors ${
                article.status === 'published'
                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                  : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10'
              }`}
              title={article.status === 'published' ? '非公開にする' : '公開する'}
            >
              <PublishIcon />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="削除"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function PublishIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M6 4V2h4v2M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
