'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
    >
      印刷 / PDF保存
    </button>
  )
}
