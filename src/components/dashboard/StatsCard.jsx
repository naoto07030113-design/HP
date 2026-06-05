export default function StatsCard({ label, value, sub, color = 'white', trend }) {
  const colorMap = {
    white: 'text-white',
    gold: 'text-gold',
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }

  return (
    <div className="card p-4 flex flex-col gap-1 hover:border-border-light transition-colors">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${colorMap[color] || 'text-white'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% 先月比
        </div>
      )}
    </div>
  )
}
