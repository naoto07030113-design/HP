import { getScoreColor, getScoreLabel } from '../../lib/utils.js'

export default function AIScoreCard({ prospect }) {
  const score = prospect.ai_score ?? 0
  const breakdown = prospect.ai_score_breakdown ?? []
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-400">AIスコア</span>
        <span className="text-xs text-gray-600">— 改善ニーズ度</span>
      </div>

      {/* Score circle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#2A2A2A" strokeWidth="6"/>
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 163.4} 163.4`}
              style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-semibold" style={{ color }}>{score}</span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-gray-500 mt-0.5">100点満点</div>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 mb-1">スコア内訳</div>
          {breakdown.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-300 truncate">{item.label}</span>
                  <span className="text-xs text-gold font-medium flex-shrink-0">+{item.points}pt</span>
                </div>
                <div className="text-xs text-gray-600">{item.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
