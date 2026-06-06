import { useBlog } from '../../contexts/BlogContext.jsx'
import { useNavigate } from 'react-router-dom'

function renderProofResult(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-sm font-semibold text-gold mt-4 mb-2">{line.slice(3)}</h3>
    }
    if (line.startsWith('# ')) {
      return <h2 key={i} className="text-base font-bold text-white mt-4 mb-2">{line.slice(2)}</h2>
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }
    // Highlight quoted text
    const parts = line.split(/"([^"]+)"/)
    return (
      <p key={i} className="text-xs text-gray-300 leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1
            ? <span key={j} className="bg-gold-muted text-gold px-1 rounded">{part}</span>
            : part
        )}
      </p>
    )
  })
}

export default function ProofReader({ title, content }) {
  const navigate = useNavigate()
  const { proofread, proofreading, proofreadResult, proofreadError, clearProofread, settings } = useBlog()
  const noApiKey = !settings.claudeApiKey

  async function handleProofread() {
    if (!title && !content) return
    try {
      await proofread(title || '（タイトルなし）', content || '（本文なし）')
    } catch {
      // error shown via proofreadError
    }
  }

  function handleCopy() {
    if (proofreadResult) {
      navigator.clipboard.writeText(proofreadResult).catch(() => {})
    }
  }

  return (
    <div className="space-y-3">
      {noApiKey && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">
          APIキーが未設定です。
          <button onClick={() => navigate('/blog/settings')} className="underline ml-1">設定する</button>
        </div>
      )}

      {!proofreadResult ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            AIが記事の文章・医療情報の正確さ・読みやすさ・SEOを分析し、改善点を提案します。
          </p>
          <button
            onClick={handleProofread}
            disabled={proofreading || noApiKey || (!title && !content)}
            className="w-full bg-surface-3 hover:bg-surface-2 border border-border hover:border-gold/30 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {proofreading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                校正中...
              </>
            ) : (
              <>
                <ProofIcon />
                校正を開始する
              </>
            )}
          </button>
          {proofreadError && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded p-2">
              {proofreadError}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gold">校正結果</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-border hover:border-border-light transition-colors"
              >
                コピー
              </button>
              <button
                onClick={clearProofread}
                className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-border hover:border-border-light transition-colors"
              >
                クリア
              </button>
            </div>
          </div>
          <div className="bg-surface-3 border border-border rounded-lg p-3 max-h-80 overflow-y-auto">
            {renderProofResult(proofreadResult)}
          </div>
          <button
            onClick={handleProofread}
            className="w-full text-xs text-gray-500 hover:text-white py-1.5 rounded border border-border hover:border-border-light transition-colors"
          >
            再校正する
          </button>
        </div>
      )}
    </div>
  )
}

function ProofIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h10M2 7h8M2 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 14l1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
