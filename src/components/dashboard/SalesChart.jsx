import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { STATUS_DOT } from '../../lib/utils.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded px-3 py-2 text-xs">
      <div className="text-gray-400 mb-1">{label}</div>
      <div className="text-white font-medium">¥{payload[0]?.value?.toLocaleString('ja-JP')}</div>
    </div>
  )
}

export default function SalesChart({ prospects }) {
  const won = prospects.filter(p => p.status === '成約')

  // Group by month
  const byMonth = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getMonth() + 1}月`
    byMonth[key] = 0
  }

  won.forEach(p => {
    if (!p.last_contact_date) return
    const d = new Date(p.last_contact_date)
    const key = `${d.getMonth() + 1}月`
    if (key in byMonth) {
      byMonth[key] += p.deal_value || 0
    }
  })

  const data = Object.entries(byMonth).map(([month, value]) => ({ month, value }))

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-white">月間成約売上</div>
        <div className="text-xs text-gray-500">過去6ヶ月</div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={28}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v === 0 ? '0' : `¥${(v / 10000).toFixed(0)}万`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={index === data.length - 1 ? '#C9A84C' : '#2A2A2A'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
