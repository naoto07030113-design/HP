import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlog } from '../../contexts/BlogContext.jsx'
import { CATEGORIES, TOPIC_SUGGESTIONS, getTodaysTopic } from '../../lib/blogTopics.js'

const TONES = ['専門的でわかりやすい', '親しみやすい', '丁寧・フォーマル', '体験談スタイル']
const WORD_COUNTS = [400, 600, 800, 1000, 1500]
const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku（高速・低コスト）' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet（高品質）' },
  { value: 'claude-opus-4-8', label: 'Opus（最高品質）' },
]

export default function ArticleGenerator({ onGenerated }) {
  const navigate = useNavigate()
  const { generateArticle, generating, generatingError, settings } = useBlog()
  const [topic, setTopic] = useState(getTodaysTopic())
  const [category, setCategory] = useState(settings.defaultCategory || '症状・疾患別')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [options, setOptions] = useState({
    tone: settings.defaultTone || '専門的でわかりやすい',
    wordCount: settings.defaultWordCount || 800,
    model: settings.defaultModel || 'claude-haiku-4-5-20251001',
  })

  async function handleGenerate() {
    if (!topic.trim()) return
    try {
      const article = await generateArticle(topic.trim(), { ...options, category })
      onGenerated?.(article)
      navigate(`/blog/editor/${article.id}`)
    } catch {
      // error shown via generatingError
    }
  }

  const suggestions = TOPIC_SUGGESTIONS[category] || []

  const noApiKey = !settings.claudeApiKey

  return (
    <div className="space-y-4">
      {noApiKey && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
          Claude APIキーが未設定です。
          <button
            onClick={() => navigate('/blog/settings')}
            className="underline ml-1 hover:text-amber-300"
          >
            設定ページで入力
          </button>
          してください。
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Topic input */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">トピック</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          placeholder="例: 肩こりに効くツボと鍼治療の効果"
          className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 resize-none"
        />
      </div>

      {/* Topic suggestions */}
      <div>
        <div className="text-xs text-gray-600 mb-1.5">提案トピック</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setTopic(s)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                topic === s
                  ? 'bg-gold-muted border-gold/30 text-gold'
                  : 'bg-surface-3 border-border text-gray-400 hover:border-border-light hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
      >
        <span>{showAdvanced ? '▼' : '▶'}</span>
        詳細オプション
      </button>

      {showAdvanced && (
        <div className="space-y-3 bg-surface-3 rounded-lg p-3 border border-border">
          <div>
            <label className="block text-xs text-gray-500 mb-1">文体・トーン</label>
            <select
              value={options.tone}
              onChange={(e) => setOptions(o => ({ ...o, tone: e.target.value }))}
              className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">文字数</label>
            <div className="flex gap-1.5 flex-wrap">
              {WORD_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setOptions(o => ({ ...o, wordCount: n }))}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    options.wordCount === n
                      ? 'bg-gold-muted border-gold/30 text-gold'
                      : 'bg-surface-2 border-border text-gray-400 hover:text-white'
                  }`}
                >
                  {n}字
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">AIモデル</label>
            <select
              value={options.model}
              onChange={(e) => setOptions(o => ({ ...o, model: e.target.value }))}
              className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {generatingError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded p-2">
          {generatingError}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !topic.trim() || noApiKey}
        className="w-full bg-gold hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <span className="animate-spin">⟳</span>
            記事を生成中...
          </>
        ) : (
          <>✦ 記事を生成する</>
        )}
      </button>
    </div>
  )
}
