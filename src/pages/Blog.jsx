import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlog } from '../contexts/BlogContext.jsx'
import ArticleCard from '../components/blog/ArticleCard.jsx'
import ArticleGenerator from '../components/blog/ArticleGenerator.jsx'
import { getTodaysTopic, getWeeklyTopics } from '../lib/blogTopics.js'
import { downloadExportFile, getSyncMeta } from '../lib/hpIntegration.js'

function formatDate(d) {
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

export default function Blog() {
  const navigate = useNavigate()
  const { articles, settings } = useBlog()
  const [showGenerator, setShowGenerator] = useState(false)

  const today = new Date()
  const todaysArticle = articles.find(a => new Date(a.createdAt).toDateString() === today.toDateString())
  const recentArticles = articles.slice(0, 6)
  const publishedCount = articles.filter(a => a.status === 'published').length
  const draftCount = articles.filter(a => a.status === 'draft').length
  const scheduledCount = articles.filter(a => a.status === 'scheduled').length
  const thisWeekCount = articles.filter(a => {
    const d = new Date(a.createdAt)
    const diff = (today - d) / 86400000
    return diff < 7
  }).length

  const weeklyTopics = getWeeklyTopics()
  const syncMeta = getSyncMeta()
  const hasApiKey = !!settings.claudeApiKey

  function handleExport() {
    const count = downloadExportFile(articles)
    alert(`${count}件の公開記事をエクスポートしました。`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">鍼灸ブログ管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-sm text-gray-400 hover:text-white border border-border hover:border-border-light px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            title="公開記事をJSONエクスポート（HP連携用）"
          >
            <ExportIcon />
            HP連携エクスポート
          </button>
          <button
            onClick={() => navigate('/blog/articles')}
            className="text-sm text-gray-400 hover:text-white border border-border hover:border-border-light px-3 py-1.5 rounded-lg transition-colors"
          >
            全記事管理
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '総記事数', value: articles.length, icon: '📄', color: 'text-white' },
          { label: '公開済み', value: publishedCount, icon: '✅', color: 'text-emerald-400' },
          { label: '下書き', value: draftCount, icon: '📝', color: 'text-gray-400' },
          { label: '今週投稿', value: thisWeekCount, icon: '📅', color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-2 border border-border rounded-xl p-4">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HP sync status */}
      {syncMeta && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
          <span className="text-blue-400 text-sm">🔗</span>
          <div className="text-xs text-gray-400">
            HP連携: <span className="text-blue-400">{syncMeta.count}件</span>の公開記事が共有ストレージに同期済み
            <span className="text-gray-600 ml-2">
              ({new Date(syncMeta.syncedAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
        </div>
      )}

      {/* API key warning */}
      {!hasApiKey && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <div className="text-sm font-medium text-amber-400 mb-1">Claude APIキーが未設定です</div>
            <div className="text-xs text-gray-400 mb-2">
              AIによる自動記事生成・校正機能を使用するにはAPIキーが必要です。
            </div>
            <button
              onClick={() => navigate('/blog/settings')}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              APIキーを設定する →
            </button>
          </div>
        </div>
      )}

      {/* Today's article */}
      <div className="bg-surface-2 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">今日の記事</h2>
            <p className="text-xs text-gray-500 mt-0.5">推奨トピック: {getTodaysTopic()}</p>
          </div>
          {!todaysArticle && (
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>✦</span>
              今日の記事を生成
            </button>
          )}
        </div>

        {todaysArticle ? (
          <div>
            <div className="text-xs text-emerald-400 mb-2">✓ 本日の記事作成済み</div>
            <ArticleCard article={todaysArticle} />
          </div>
        ) : showGenerator ? (
          <div className="border border-border rounded-xl p-4 bg-surface-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">AI記事生成</span>
              <button onClick={() => setShowGenerator(false)} className="text-gray-500 hover:text-white text-xs">✕ 閉じる</button>
            </div>
            <ArticleGenerator onGenerated={() => setShowGenerator(false)} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <div className="text-4xl mb-3">📝</div>
            <div className="text-sm mb-1">本日はまだ記事が作成されていません</div>
            <div className="text-xs">「今日の記事を生成」ボタンでAIが記事を作成します</div>
          </div>
        )}
      </div>

      {/* Weekly plan */}
      <div className="bg-surface-2 border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-3">今週のトピック提案</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {weeklyTopics.slice(0, 7).map(({ topic, date }) => {
            const isToday = date.toDateString() === today.toDateString()
            const hasArticle = articles.some(a => new Date(a.createdAt).toDateString() === date.toDateString())
            return (
              <div
                key={date.toISOString()}
                className={`p-3 rounded-lg border text-xs ${
                  isToday
                    ? 'border-gold/30 bg-gold-muted'
                    : 'border-border bg-surface-3'
                }`}
              >
                <div className={`font-medium mb-1 ${isToday ? 'text-gold' : 'text-gray-400'}`}>
                  {date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                  {isToday && ' ← 今日'}
                </div>
                <div className={`leading-tight ${hasArticle ? 'text-emerald-400 line-through' : 'text-gray-300'}`}>
                  {topic}
                </div>
                {hasArticle && <div className="text-emerald-500 mt-1">✓ 作成済み</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">最近の記事</h2>
            <button
              onClick={() => navigate('/blog/articles')}
              className="text-xs text-gray-500 hover:text-gold transition-colors"
            >
              全て見る →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {articles.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-5xl mb-4">✍️</div>
          <div className="text-base font-medium text-gray-400 mb-2">まだ記事がありません</div>
          <div className="text-sm mb-4">AIを使って最初の鍼灸記事を作成しましょう</div>
          <button
            onClick={() => navigate('/blog/editor')}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            最初の記事を作成する
          </button>
        </div>
      )}
    </div>
  )
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
