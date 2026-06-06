import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBlog } from '../contexts/BlogContext.jsx'
import PhotoUploader from '../components/blog/PhotoUploader.jsx'
import ArticleGenerator from '../components/blog/ArticleGenerator.jsx'
import ProofReader from '../components/blog/ProofReader.jsx'
import ArticlePreview from '../components/blog/ArticlePreview.jsx'
import { CATEGORIES } from '../lib/blogTopics.js'

const TABS = [
  { key: 'edit', label: '編集' },
  { key: 'preview', label: 'プレビュー' },
  { key: 'seo', label: 'SEO' },
]

const TOOL_TABS = [
  { key: 'generate', label: 'AI生成' },
  { key: 'photos', label: '写真添付' },
  { key: 'proofread', label: '校正' },
]

function insertAtCursor(textarea, before, after = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end)
  const replacement = before + selected + after
  const newVal = textarea.value.slice(0, start) + replacement + textarea.value.slice(end)
  return { value: newVal, cursor: start + before.length + selected.length + after.length }
}

export default function BlogEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getArticle, createArticle, updateArticle, publishArticle, unpublishArticle, generateSEO } = useBlog()

  const isNew = !id
  const [article, setArticle] = useState(() => {
    if (id) return getArticle(id) || null
    return {
      id: null,
      title: '',
      content: '',
      excerpt: '',
      photos: [],
      category: '症状・疾患別',
      tags: [],
      status: 'draft',
      seo: { title: '', description: '', keywords: [] },
    }
  })
  const [activeTab, setActiveTab] = useState('edit')
  const [activeTool, setActiveTool] = useState('generate')
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [tagInput, setTagInput] = useState('')
  const [generatingSEO, setGeneratingSEO] = useState(false)
  const textareaRef = useRef(null)
  const savedIdRef = useRef(id || null)

  useEffect(() => {
    if (id && !article) {
      navigate('/blog/articles')
    }
  }, [id, article, navigate])

  const patchArticle = useCallback((patch) => {
    setArticle(prev => ({ ...prev, ...patch }))
    setIsDirty(true)
    setSaveStatus('unsaved')
  }, [])

  const handleSave = useCallback(() => {
    if (!article) return
    setSaveStatus('saving')
    if (savedIdRef.current) {
      updateArticle(savedIdRef.current, article)
    } else {
      const saved = createArticle(article)
      savedIdRef.current = saved.id
      navigate(`/blog/editor/${saved.id}`, { replace: true })
    }
    setIsDirty(false)
    setSaveStatus('saved')
  }, [article, createArticle, updateArticle, navigate])

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(handleSave, 30000)
    return () => clearTimeout(timer)
  }, [isDirty, handleSave])

  // Ctrl+S save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  function handleToolbarAction(action) {
    const ta = textareaRef.current
    if (!ta) return
    let result
    switch (action) {
      case 'h2':   result = insertAtCursor(ta, '\n## ', ''); break
      case 'h3':   result = insertAtCursor(ta, '\n### ', ''); break
      case 'bold': result = insertAtCursor(ta, '**', '**'); break
      case 'italic': result = insertAtCursor(ta, '*', '*'); break
      case 'list': result = insertAtCursor(ta, '\n- ', ''); break
      default: return
    }
    patchArticle({ content: result.value })
    setTimeout(() => {
      if (ta) {
        ta.focus()
        ta.setSelectionRange(result.cursor, result.cursor)
      }
    }, 0)
  }

  function handlePublish() {
    if (!savedIdRef.current) { handleSave(); return }
    if (article.status === 'published') {
      unpublishArticle(savedIdRef.current)
      patchArticle({ status: 'draft', publishedAt: null })
    } else {
      publishArticle(savedIdRef.current)
      patchArticle({ status: 'published', publishedAt: new Date().toISOString() })
    }
    setSaveStatus('saved')
    setIsDirty(false)
  }

  async function handleGenerateSEO() {
    if (!article?.title || !article?.content) return
    setGeneratingSEO(true)
    try {
      const seo = await generateSEO(article.title, article.content)
      if (seo) {
        patchArticle({
          seo: {
            title: seo.seoTitle || article.seo?.title || '',
            description: seo.seoDescription || article.seo?.description || '',
            keywords: seo.keywords || article.seo?.keywords || [],
          }
        })
      }
    } finally {
      setGeneratingSEO(false)
    }
  }

  function handleAddTag() {
    const tag = tagInput.trim()
    if (!tag || article.tags?.includes(tag)) { setTagInput(''); return }
    patchArticle({ tags: [...(article.tags || []), tag] })
    setTagInput('')
  }

  function handleRemoveTag(tag) {
    patchArticle({ tags: article.tags.filter(t => t !== tag) })
  }

  if (!article) return (
    <div className="text-gray-500 text-sm p-8 text-center">記事が見つかりません</div>
  )

  const isPublished = article.status === 'published'

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => navigate('/blog')}
          className="text-gray-500 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← ブログ管理
        </button>
        <div className="flex-1" />

        <span className={`text-xs px-2 py-1 rounded-full border ${
          saveStatus === 'saved' ? 'text-gray-600 border-border' :
          saveStatus === 'saving' ? 'text-blue-400 border-blue-400/30' :
          'text-amber-400 border-amber-400/30'
        }`}>
          {saveStatus === 'saved' ? '保存済み' : saveStatus === 'saving' ? '保存中...' : '未保存'}
        </span>

        <button
          onClick={handleSave}
          className="text-sm border border-border hover:border-border-light text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          保存 (⌘S)
        </button>

        <button
          onClick={handlePublish}
          className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
            isPublished
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-gold hover:bg-gold-dark text-black'
          }`}
        >
          {isPublished ? '✓ 公開中 → 非公開に' : '公開する'}
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Article tabs */}
          <div className="flex gap-1 mb-3 bg-surface-2 border border-border rounded-xl p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs px-4 py-1.5 rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-surface-3 text-white font-medium'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'edit' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-y-auto">
              {/* Title */}
              <input
                type="text"
                value={article.title}
                onChange={(e) => patchArticle({ title: e.target.value })}
                placeholder="記事タイトルを入力..."
                className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-lg font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
              />

              {/* Metadata row */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={article.category}
                  onChange={(e) => patchArticle({ category: e.target.value })}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 flex-shrink-0"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Tags */}
                <div className="flex items-center gap-1 flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 flex-wrap">
                  {article.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-surface-3 border border-border text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="text-gray-600 hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                    placeholder={article.tags?.length === 0 ? 'タグを追加（Enterで確定）' : ''}
                    className="text-xs text-white placeholder-gray-600 bg-transparent outline-none min-w-24 flex-1"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <textarea
                value={article.excerpt}
                onChange={(e) => patchArticle({ excerpt: e.target.value })}
                placeholder="記事の要約（検索結果・SNSシェア時に表示されます）"
                rows={2}
                className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors resize-none"
              />

              {/* Toolbar */}
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl px-3 py-2">
                {[
                  { action: 'h2', label: 'H2' },
                  { action: 'h3', label: 'H3' },
                  { action: 'bold', label: 'B', cls: 'font-bold' },
                  { action: 'italic', label: 'I', cls: 'italic' },
                  { action: 'list', label: '≡' },
                ].map(btn => (
                  <button
                    key={btn.action}
                    onClick={() => handleToolbarAction(btn.action)}
                    className={`text-xs text-gray-400 hover:text-white hover:bg-surface-3 px-2 py-1 rounded transition-colors ${btn.cls || ''}`}
                  >
                    {btn.label}
                  </button>
                ))}
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-xs text-gray-600">Markdown対応</span>
                <div className="ml-auto text-xs text-gray-600">
                  {article.content?.length || 0}字
                </div>
              </div>

              {/* Content editor */}
              <textarea
                ref={textareaRef}
                value={article.content}
                onChange={(e) => patchArticle({ content: e.target.value })}
                placeholder={`## はじめに\n\n本文をMarkdownで入力できます。\n\n## 見出しをつけて\n\n- リストも使えます\n- **太字**や*斜体*も対応`}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors resize-none font-mono leading-relaxed"
                style={{ minHeight: '300px' }}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="flex-1 overflow-y-auto bg-surface-2 border border-border rounded-xl p-4">
              <ArticlePreview article={article} />
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-surface-2 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">SEO設定</h3>
                  <button
                    onClick={handleGenerateSEO}
                    disabled={generatingSEO || !article.title}
                    className="text-xs bg-gold-muted border border-gold/20 text-gold hover:bg-gold/20 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {generatingSEO ? '生成中...' : '✦ AIで最適化'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      SEOタイトル <span className="text-gray-600">（60文字以内推奨）</span>
                    </label>
                    <input
                      type="text"
                      value={article.seo?.title || ''}
                      onChange={(e) => patchArticle({ seo: { ...article.seo, title: e.target.value } })}
                      placeholder={article.title || 'SEOタイトルを入力'}
                      className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50"
                    />
                    <div className={`text-xs mt-1 ${(article.seo?.title?.length || 0) > 60 ? 'text-red-400' : 'text-gray-600'}`}>
                      {article.seo?.title?.length || 0} / 60文字
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      メタディスクリプション <span className="text-gray-600">（120文字以内推奨）</span>
                    </label>
                    <textarea
                      value={article.seo?.description || ''}
                      onChange={(e) => patchArticle({ seo: { ...article.seo, description: e.target.value } })}
                      placeholder={article.excerpt || 'メタディスクリプションを入力'}
                      rows={3}
                      className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 resize-none"
                    />
                    <div className={`text-xs mt-1 ${(article.seo?.description?.length || 0) > 120 ? 'text-red-400' : 'text-gray-600'}`}>
                      {article.seo?.description?.length || 0} / 120文字
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">SEOキーワード</label>
                    <div className="flex flex-wrap gap-1.5 bg-surface-3 border border-border rounded-lg p-2 min-h-10">
                      {article.seo?.keywords?.map(kw => (
                        <span key={kw} className="text-xs bg-surface-2 border border-border text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {kw}
                          <button
                            onClick={() => patchArticle({ seo: { ...article.seo, keywords: article.seo.keywords.filter(k => k !== kw) } })}
                            className="text-gray-600 hover:text-red-400"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Google preview */}
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <div className="text-xs text-gray-400 mb-2">Googleプレビュー</div>
                    <div className="text-base text-blue-700 font-medium leading-tight">
                      {article.seo?.title || article.title || '記事タイトル'}
                    </div>
                    <div className="text-xs text-green-700 mt-0.5">https://your-domain.com/blog/...</div>
                    <div className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                      {article.seo?.description || article.excerpt || 'メタディスクリプション'}
                    </div>
                  </div>
                </div>
              </div>

              {/* HP Integration info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="text-sm font-medium text-blue-400 mb-2">🔗 HP連携情報</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>記事ID: <span className="text-gray-300 font-mono">{savedIdRef.current || '（保存後に生成）'}</span></div>
                  <div>ステータス: <span className="text-gray-300">{article.status === 'published' ? '公開済み（HP連携対象）' : '下書き（公開後にHP連携）'}</span></div>
                  <div className="mt-2 text-gray-500">公開済み記事は自動的にHP連携用の共有ストレージに同期されます。</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right tool panel */}
        <div className="w-72 flex-shrink-0 hidden lg:flex flex-col">
          {/* Tool tabs */}
          <div className="flex gap-1 mb-3 bg-surface-2 border border-border rounded-xl p-1">
            {TOOL_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTool(tab.key)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                  activeTool === tab.key
                    ? 'bg-surface-3 text-white font-medium'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool content */}
          <div className="flex-1 bg-surface-2 border border-border rounded-xl p-4 overflow-y-auto">
            {activeTool === 'generate' && (
              <div>
                <div className="text-xs font-medium text-gray-400 mb-3">AI記事生成</div>
                <ArticleGenerator
                  onGenerated={(a) => {
                    navigate(`/blog/editor/${a.id}`)
                  }}
                />
              </div>
            )}
            {activeTool === 'photos' && (
              <div>
                <div className="text-xs font-medium text-gray-400 mb-3">写真添付</div>
                <PhotoUploader
                  photos={article.photos}
                  onChange={(photos) => patchArticle({ photos })}
                />
              </div>
            )}
            {activeTool === 'proofread' && (
              <div>
                <div className="text-xs font-medium text-gray-400 mb-3">AI校正</div>
                <ProofReader title={article.title} content={article.content} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile tool drawer */}
      <div className="lg:hidden mt-4">
        <div className="flex gap-1 bg-surface-2 border border-border rounded-xl p-1 mb-2">
          {TOOL_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTool(activeTool === tab.key ? null : tab.key)}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                activeTool === tab.key
                  ? 'bg-surface-3 text-white font-medium'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTool && (
          <div className="bg-surface-2 border border-border rounded-xl p-4">
            {activeTool === 'generate' && <ArticleGenerator onGenerated={(a) => navigate(`/blog/editor/${a.id}`)} />}
            {activeTool === 'photos' && <PhotoUploader photos={article.photos} onChange={(photos) => patchArticle({ photos })} />}
            {activeTool === 'proofread' && <ProofReader title={article.title} content={article.content} />}
          </div>
        )}
      </div>
    </div>
  )
}
