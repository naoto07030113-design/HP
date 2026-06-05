import { useState } from 'react'
import { generateEmail, generateDM, generatePhoneScript } from '../../lib/aiTemplates.js'

const TABS = [
  { key: 'email', label: 'メール', icon: '✉' },
  { key: 'dm', label: 'DM', icon: '💬' },
  { key: 'phone', label: '電話台本', icon: '📞' },
]

export default function AIContentPanel({ prospect }) {
  const [tab, setTab] = useState('email')
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  function generate() {
    setGenerating(true)
    setCopied(false)
    setTimeout(() => {
      const generated =
        tab === 'email' ? generateEmail(prospect)
        : tab === 'dm' ? generateDM(prospect)
        : generatePhoneScript(prospect)
      setContent(generated)
      setGenerating(false)
    }, 600)
  }

  function copy() {
    if (!content) return
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-400">AI営業コンテンツ生成</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-surface p-1 rounded">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setContent('') }}
            className={`flex-1 text-xs px-2 py-1.5 rounded transition-all duration-150 ${
              tab === t.key ? 'bg-gold text-black font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={generating}
        className="w-full btn-gold text-sm py-2 mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {generating ? (
          <>
            <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            生成中…
          </>
        ) : (
          <>✨ {TABS.find(t => t.key === tab)?.label}を生成</>
        )}
      </button>

      {/* Content */}
      {content && (
        <>
          <div className="relative">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-field text-xs font-mono h-56 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={copy}
              className={`btn-ghost text-xs flex-1 flex items-center justify-center gap-1 ${copied ? 'text-green-400 border-green-800' : ''}`}
            >
              {copied ? '✓ コピー済み' : '📋 コピー'}
            </button>
            <button onClick={generate} className="btn-ghost text-xs px-3">
              🔄 再生成
            </button>
          </div>
        </>
      )}
    </div>
  )
}
