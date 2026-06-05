import { useProspects } from '../contexts/ProspectContext.jsx'
import StatsCard from '../components/dashboard/StatsCard.jsx'
import SalesChart from '../components/dashboard/SalesChart.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatDate, formatCurrency, getScoreColor } from '../lib/utils.js'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { prospects } = useProspects()
  const navigate = useNavigate()

  const total = prospects.length
  const active = prospects.filter(p => p.status === '営業中').length
  const replied = prospects.filter(p => p.status === '返信あり').length
  const negotiating = prospects.filter(p => p.status === '商談').length
  const won = prospects.filter(p => p.status === '成約')
  const wonCount = won.length
  const winRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) : 0
  const totalRevenue = won.reduce((s, p) => s + (p.deal_value || 0), 0)
  const predictedRevenue = prospects
    .filter(p => p.status === '商談' || p.status === '返信あり')
    .reduce((s, p) => s + (p.deal_value || 0), 0)

  const recentlyUpdated = [...prospects]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8)

  const topProspects = [...prospects]
    .filter(p => p.status === '未接触')
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard label="総案件数" value={total} sub="全ステータス" />
        <StatsCard label="営業中" value={active} color="blue" />
        <StatsCard label="返信あり" value={replied} color="yellow" />
        <StatsCard label="商談数" value={negotiating} color="yellow" />
        <StatsCard label="成約数" value={wonCount} color="green" />
        <StatsCard label="成約率" value={`${winRate}%`} color="gold" />
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">累計売上</div>
          <div className="text-2xl font-semibold text-gold tabular-nums">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-gray-600 mt-1">成約済み合計</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">予測売上</div>
          <div className="text-2xl font-semibold text-white tabular-nums">{formatCurrency(predictedRevenue)}</div>
          <div className="text-xs text-gray-600 mt-1">商談・返信あり案件合計</div>
        </div>
      </div>

      {/* Chart + Top Prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart prospects={prospects} />
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold text-white mb-3">優先アプローチ候補</div>
          <div className="space-y-2">
            {topProspects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/prospects/${p.id}`)}
                className="flex items-center gap-3 p-2 rounded hover:bg-surface-3 cursor-pointer transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: getScoreColor(p.ai_score) + '22', color: getScoreColor(p.ai_score) }}
                >
                  {p.ai_score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white font-medium group-hover:text-gold transition-colors truncate">{p.store_name}</div>
                  <div className="text-xs text-gray-600">{p.industry}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-white">最近の更新</div>
        </div>
        <div className="divide-y divide-border">
          {recentlyUpdated.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/prospects/${p.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50 cursor-pointer transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white group-hover:text-gold transition-colors font-medium truncate">{p.store_name}</span>
                  <span className="text-xs text-gray-600 hidden sm:block">{p.industry}</span>
                </div>
              </div>
              <StatusBadge status={p.status} size="xs" />
              <span className="text-xs text-gray-600 flex-shrink-0 hidden sm:block">{formatDate(p.updated_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
