import { useNavigate } from 'react-router-dom'
import { useGenerator } from '../contexts/GeneratorContext'
import { generateHTML } from '../components/generator/generateHTML'

export default function PreviewPage() {
  const navigate = useNavigate()
  const { data } = useGenerator()
  const html = generateHTML(data)

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.businessName || 'website'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Toolbar */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          編集に戻る
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-slate-300 text-sm font-mono">
              {data.businessName || 'preview'}.html
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            HTMLをダウンロード
          </button>
        </div>
      </header>

      {/* Info bar */}
      <div className="bg-indigo-900/40 border-b border-indigo-800/50 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-indigo-300 text-xs font-medium">
          💡 このプレビューは完成イメージです。HTMLをダウンロードしてサーバーにアップロードすると公開できます。
        </span>
      </div>

      {/* Full-screen iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={html}
          title="サイトフルプレビュー"
          className="w-full h-full border-none"
        />
      </div>

      {/* Bottom actions */}
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>✅ レスポンシブ対応</span>
          <span className="text-slate-600">•</span>
          <span>✅ 自己完結HTML</span>
          <span className="text-slate-600">•</span>
          <span>✅ SEO基本対応</span>
        </div>
        <button
          onClick={handleDownload}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-black text-sm transition-colors"
        >
          ⬇ ダウンロード
        </button>
      </div>
    </div>
  )
}
