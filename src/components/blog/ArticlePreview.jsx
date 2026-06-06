import { useState } from 'react'

function parseMarkdown(text) {
  if (!text) return ''
  const lines = text.split('\n')
  const result = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      result.push(`<h3 class="text-base font-bold text-white mt-5 mb-2">${escHtml(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      result.push(`<h2 class="text-lg font-bold text-white mt-6 mb-3 pb-2 border-b border-border">${escHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      result.push(`<h1 class="text-xl font-bold text-white mt-6 mb-4">${escHtml(line.slice(2))}</h1>`)
    } else if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li class="text-gray-300 text-sm">${inlineMarkdown(lines[i].slice(2))}</li>`)
        i++
      }
      result.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-2">${items.join('')}</ul>`)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li class="text-gray-300 text-sm">${inlineMarkdown(lines[i].replace(/^\d+\. /, ''))}</li>`)
        i++
      }
      result.push(`<ol class="list-decimal list-inside space-y-1 my-3 ml-2">${items.join('')}</ol>`)
      continue
    } else if (line.trim() === '') {
      result.push('<div class="h-2"></div>')
    } else {
      result.push(`<p class="text-gray-300 text-sm leading-relaxed my-1">${inlineMarkdown(line)}</p>`)
    }
    i++
  }

  return result.join('')
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMarkdown(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-200">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-3 text-gold px-1 rounded text-xs">$1</code>')
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ArticlePreview({ article }) {
  const [viewMode, setViewMode] = useState('desktop')

  if (!article) return (
    <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
      プレビューする記事がありません
    </div>
  )

  const html = parseMarkdown(article.content)

  return (
    <div className="space-y-3">
      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('desktop')}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            viewMode === 'desktop'
              ? 'bg-gold-muted border-gold/30 text-gold'
              : 'border-border text-gray-500 hover:text-white hover:border-border-light'
          }`}
        >
          💻 PC
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            viewMode === 'mobile'
              ? 'bg-gold-muted border-gold/30 text-gold'
              : 'border-border text-gray-500 hover:text-white hover:border-border-light'
          }`}
        >
          📱 スマホ
        </button>
        <span className="text-xs text-gray-600 ml-auto">実際の表示イメージ</span>
      </div>

      {/* Preview frame */}
      <div className={`transition-all mx-auto ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-full'}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Featured image */}
          {article.photos?.[0] && (
            <img
              src={article.photos[0].data}
              alt={article.title}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-5">
            {/* Category & tags */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {article.category && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {article.category}
                </span>
              )}
              {article.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs text-gray-400">#{tag}</span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
              {article.title || '（タイトルなし）'}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{article.excerpt}</p>
            )}

            {/* Meta */}
            <div className="text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
              {formatDate(article.publishedAt || article.createdAt)}
            </div>

            {/* Content */}
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: html }}
              style={{ color: '#374151' }}
            />

            {/* Additional photos */}
            {article.photos?.length > 1 && (
              <div className="mt-6 grid grid-cols-2 gap-2">
                {article.photos.slice(1).map(photo => (
                  <div key={photo.id}>
                    <img
                      src={photo.data}
                      alt={photo.caption || ''}
                      className="w-full h-28 object-cover rounded"
                    />
                    {photo.caption && (
                      <p className="text-xs text-gray-400 mt-1">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
