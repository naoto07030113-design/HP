'use client'

export default function PrintButton({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <button
      onClick={() => window.print()}
      className={
        fullWidth
          ? 'w-full bg-green-800 text-white py-3 rounded-xl font-semibold text-sm'
          : 'text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors'
      }
    >
      印刷 / PDF保存
    </button>
  )
}
