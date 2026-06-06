// HP連携モジュール
// 将来のHP作成アプリと共有するデータフォーマットを定義します
// HPアプリはこのストレージキーとフォーマットを使用してブログ記事を取得できます

export const HP_ARTICLES_KEY = 'hp_blog_articles'
export const HP_SYNC_KEY = 'hp_blog_sync_meta'
export const HP_EXPORT_VERSION = '1.0'

export function formatArticleForHP(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt || '',
    featuredImage: article.photos?.[0]?.data || null,
    images: (article.photos || []).map(p => ({
      id: p.id,
      data: p.data,
      caption: p.caption || '',
      alt: p.alt || p.caption || article.title,
    })),
    category: article.category,
    tags: article.tags || [],
    status: article.status,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt || null,
    scheduledFor: article.scheduledFor || null,
    seo: article.seo || { title: '', description: '', keywords: [] },
  }
}

export function buildExportPayload(articles) {
  const exportable = articles.filter(a => a.status === 'published' || a.status === 'scheduled')
  return {
    version: HP_EXPORT_VERSION,
    source: 'acupuncture-blog-app',
    exportedAt: new Date().toISOString(),
    count: exportable.length,
    articles: exportable.map(formatArticleForHP),
  }
}

export function downloadExportFile(articles) {
  const data = buildExportPayload(articles)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `acupuncture-blog-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return data.count
}

export function syncToSharedStorage(articles) {
  try {
    const data = buildExportPayload(articles)
    localStorage.setItem(HP_ARTICLES_KEY, JSON.stringify(data))
    const meta = {
      syncedAt: new Date().toISOString(),
      count: data.count,
      version: HP_EXPORT_VERSION,
    }
    localStorage.setItem(HP_SYNC_KEY, JSON.stringify(meta))
    return meta
  } catch {
    return null
  }
}

export function getSyncMeta() {
  try {
    const meta = localStorage.getItem(HP_SYNC_KEY)
    return meta ? JSON.parse(meta) : null
  } catch {
    return null
  }
}

// HPアプリから呼び出すためのAPI（将来の実装用スタブ）
export function readFromSharedStorage() {
  try {
    const data = localStorage.getItem(HP_ARTICLES_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}
