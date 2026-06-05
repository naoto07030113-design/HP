import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../ui/StatusBadge.jsx'
import { getScoreColor, formatDate, INDUSTRY_LIST, STATUS_LIST } from '../../lib/utils.js'

export default function ProspectTable({ prospects, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState('ai_score')
  const [sortDir, setSortDir] = useState('desc')

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...prospects].sort((a, b) => {
    let va = a[sortKey] ?? ''
    let vb = b[sortKey] ?? ''
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ col }) => (
    <span className={`ml-1 text-xs ${sortKey === col ? 'text-gold' : 'text-gray-700'}`}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const Th = ({ col, label, cls = '' }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-300 select-none whitespace-nowrap ${cls}`}
    >
      {label}<SortIcon col={col} />
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="border-b border-border">
          <tr>
            <Th col="store_name" label="店舗名" />
            <Th col="industry" label="業種" />
            <Th col="status" label="ステータス" />
            <Th col="ai_score" label="AIスコア" />
            <Th col="rating" label="評価" />
            <Th col="review_count" label="口コミ" />
            <Th col="assigned_to" label="担当" />
            <Th col="last_contact_date" label="最終接触" />
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-20">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map(p => (
            <tr
              key={p.id}
              onClick={() => navigate(`/prospects/${p.id}`)}
              className="hover:bg-surface-2/50 cursor-pointer transition-colors group"
            >
              <td className="px-3 py-3">
                <div className="text-sm text-white font-medium group-hover:text-gold transition-colors">{p.store_name}</div>
                <div className="text-xs text-gray-600 mt-0.5 truncate max-w-[180px]">{p.address}</div>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-400">{p.industry}</span>
              </td>
              <td className="px-3 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: getScoreColor(p.ai_score) }}>
                    {p.ai_score}
                  </span>
                  <div className="w-12 score-bar hidden sm:block">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${p.ai_score}%`, background: getScoreColor(p.ai_score) }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-300">{p.rating ?? '—'}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-300">{p.review_count ?? 0}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-400">{p.assigned_to || '—'}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-gray-500">{formatDate(p.last_contact_date)}</span>
              </td>
              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 rounded text-gray-500 hover:text-gold hover:bg-gold-muted transition-colors"
                    title="編集"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="削除"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="py-16 text-center text-gray-600 text-sm">
          該当する見込み客がありません
        </div>
      )}
    </div>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
