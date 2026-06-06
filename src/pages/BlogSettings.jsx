import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlog, DEFAULT_SETTINGS } from '../contexts/BlogContext.jsx'
import { CATEGORIES } from '../lib/blogTopics.js'
import { getSyncMeta, syncToSharedStorage } from '../lib/hpIntegration.js'

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku', desc: '高速・低コスト。短い記事向き。' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet', desc: '高品質でバランス良好。推奨。' },
  { value: 'claude-opus-4-8', label: 'Claude Opus', desc: '最高品質。詳細な記事向き。' },
]

const TONES = [
  '専門的でわかりやすい',
  '親しみやすい',
  '丁寧・フォーマル',
  '体験談スタイル',
  '会話形式',
]

const WORD_COUNTS = [400, 600, 800, 1000, 1500, 2000]

export default function BlogSettings() {
  const navigate = useNavigate()
  const { settings, updateSettings, articles } = useBlog()
  const [form, setForm] = useState({ ...settings })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testStatus, setTestStatus] = useState(null)
  const syncMeta = getSyncMeta()

  function patch(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (confirm('設定をデフォルトに戻しますか？（APIキーは保持されます）')) {
      const reset = { ...DEFAULT_SETTINGS, claudeApiKey: form.claudeApiKey }
      setForm(reset)
      updateSettings(reset)
    }
  }

  async function handleTestAPI() {
    if (!form.claudeApiKey) return
    setTestStatus('testing')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': form.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      setTestStatus(res.ok ? 'ok' : 'error')
    } catch {
      setTestStatus('error')
    }
    setTimeout(() => setTestStatus(null), 4000)
  }

  function handleManualSync() {
    syncToSharedStorage(articles)
    alert('HP連携ストレージを同期しました。')
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/blog')} className="text-gray-500 hover:text-white text-sm transition-colors">
          ← ブログ管理
        </button>
        <h1 className="text-xl font-bold text-white">ブログ設定</h1>
      </div>

      {/* API Key */}
      <section className="bg-surface-2 border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-1">Claude APIキー</h2>
        <p className="text-xs text-gray-500 mb-4">
          AI記事生成・校正機能に使用します。
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-light ml-1 underline"
          >
            Anthropic Console
          </a>
          から取得できます。
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.claudeApiKey}
              onChange={(e) => patch('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              {showKey ? '隠す' : '表示'}
            </button>
          </div>
          <button
            onClick={handleTestAPI}
            disabled={!form.claudeApiKey || testStatus === 'testing'}
            className="text-sm border border-border hover:border-border-light text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {testStatus === 'testing' ? '確認中...' : testStatus === 'ok' ? '✓ 有効' : testStatus === 'error' ? '✗ 無効' : 'テスト'}
          </button>
        </div>

        {testStatus === 'ok' && (
          <div className="mt-2 text-xs text-emerald-400">APIキーが正常に動作しています。</div>
        )}
        {testStatus === 'error' && (
          <div className="mt-2 text-xs text-red-400">APIキーが無効です。正しいキーを入力してください。</div>
        )}

        <div className="mt-3 text-xs text-gray-600 bg-surface-3 border border-border rounded p-2">
          🔒 APIキーはこのブラウザのローカルストレージに保存されます。外部サーバーには送信されません。
        </div>
      </section>

      {/* Generation defaults */}
      <section className="bg-surface-2 border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">記事生成デフォルト設定</h2>

        <div className="space-y-4">
          {/* Model */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">デフォルトモデル</label>
            <div className="space-y-2">
              {MODELS.map(m => (
                <label key={m.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="model"
                    value={m.value}
                    checked={form.defaultModel === m.value}
                    onChange={() => patch('defaultModel', m.value)}
                    className="mt-0.5 accent-yellow-500"
                  />
                  <div>
                    <div className={`text-sm ${form.defaultModel === m.value ? 'text-gold' : 'text-gray-300'}`}>
                      {m.label}
                    </div>
                    <div className="text-xs text-gray-600">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">デフォルトの文体・トーン</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => patch('defaultTone', t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    form.defaultTone === t
                      ? 'bg-gold-muted border-gold/30 text-gold'
                      : 'bg-surface-3 border-border text-gray-400 hover:text-white hover:border-border-light'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Word count */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">デフォルト文字数</label>
            <div className="flex gap-2 flex-wrap">
              {WORD_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => patch('defaultWordCount', n)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    form.defaultWordCount === n
                      ? 'bg-gold-muted border-gold/30 text-gold'
                      : 'bg-surface-3 border-border text-gray-400 hover:text-white hover:border-border-light'
                  }`}
                >
                  {n}字
                </button>
              ))}
            </div>
          </div>

          {/* Default category */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">デフォルトカテゴリ</label>
            <select
              value={form.defaultCategory}
              onChange={(e) => patch('defaultCategory', e.target.value)}
              className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none w-full"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* HP Integration */}
      <section className="bg-surface-2 border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-1">HP連携設定</h2>
        <p className="text-xs text-gray-500 mb-4">
          将来のHP作成アプリと自動連携するための設定です。現在はローカルストレージを共有ストレージとして使用します。
        </p>

        <div className="space-y-3">
          <div className="bg-surface-3 border border-border rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <div>共有ストレージキー: <code className="text-gold">hp_blog_articles</code></div>
            <div>
              最終同期:
              <span className="text-gray-300 ml-1">
                {syncMeta
                  ? `${new Date(syncMeta.syncedAt).toLocaleString('ja-JP')} (${syncMeta.count}件)`
                  : '未同期'}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="font-medium text-blue-400 mb-1">HPアプリとの連携方法</div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>記事を公開すると自動的に共有ストレージに同期されます</li>
              <li>HPアプリは <code className="text-blue-300">hp_blog_articles</code> キーを読み込みます</li>
              <li>「エクスポート」でJSONファイルとしてダウンロードも可能です</li>
            </ol>
          </div>

          <button
            onClick={handleManualSync}
            className="text-sm border border-border hover:border-border-light text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            今すぐ同期する
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-gold hover:bg-gold-dark text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          {saved ? '✓ 保存しました' : '設定を保存する'}
        </button>
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-white border border-border hover:border-border-light px-4 py-2.5 rounded-lg transition-colors"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  )
}
