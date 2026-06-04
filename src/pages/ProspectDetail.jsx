import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProspects } from '../contexts/ProspectContext.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import AIScoreCard from '../components/ai/AIScoreCard.jsx'
import AIContentPanel from '../components/ai/AIContentPanel.jsx'
import ProspectForm from '../components/prospects/ProspectForm.jsx'
import Modal from '../components/ui/Modal.jsx'
import { STATUS_LIST, formatDate, formatCurrency } from '../lib/utils.js'

export default function ProspectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { prospects, dispatch } = useProspects()
  const prospect = prospects.find(p => p.id === id)
  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState('')
  const [activities, setActivities] = useState([])

  if (!prospect) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      見込み客が見つかりません
    </div>
  )

  function handleUpdate(data) {
    dispatch({ type: 'UPDATE', payload: data })
    setEditOpen(false)
  }

  function handleStatusChange(status) {
    dispatch({ type: 'UPDATE_STATUS', payload: { id: prospect.id, status } })
  }

  function addNote() {
    if (!note.trim()) return
    setActivities(a => [{ text: note, date: new Date().toISOString(), id: Date.now() }, ...a])
    setNote('')
  }

  const InfoRow = ({ label, value }) => (
    <div className="flex gap-3">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-200 flex-1 break-all">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/prospects')}
          className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-surface-2 transition-colors mt-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{prospect.store_name}</h2>
            <span className="text-sm text-gray-500">{prospect.industry}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <StatusBadge status={prospect.status} />
            {prospect.address && <span className="text-xs text-gray-600">{prospect.address}</span>}
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} className="btn-ghost text-xs">
          編集
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Basic Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info card */}
          <div className="card p-4">
            <div className="text-xs font-medium text-gray-400 mb-3">基本情報</div>
            <div className="space-y-2">
              <InfoRow label="電話番号" value={prospect.phone} />
              <InfoRow label="ホームページ" value={prospect.website_url} />
              <InfoRow label="評価" value={prospect.rating ? `${prospect.rating} / 5.0` : null} />
              <InfoRow label="口コミ数" value={prospect.review_count ? `${prospect.review_count}件` : null} />
              <InfoRow label="営業担当" value={prospect.assigned_to} />
              <InfoRow label="予測売上" value={formatCurrency(prospect.deal_value)} />
              <InfoRow label="初回接触日" value={formatDate(prospect.first_contact_date)} />
              <InfoRow label="最終接触日" value={formatDate(prospect.last_contact_date)} />
              {prospect.notes && <InfoRow label="備考" value={prospect.notes} />}
            </div>
          </div>

          {/* Status change */}
          <div className="card p-4">
            <div className="text-xs font-medium text-gray-400 mb-3">ステータス変更</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_LIST.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1.5 rounded border transition-all duration-150 ${
                    s === prospect.status
                      ? 'bg-gold/15 border-gold/30 text-gold'
                      : 'border-border text-gray-500 hover:border-border-light hover:text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="card p-4">
            <div className="text-xs font-medium text-gray-400 mb-3">活動履歴</div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNote() }}
                placeholder="活動メモを入力… (Enter で追加)"
                className="input-field flex-1 text-xs"
              />
              <button onClick={addNote} className="btn-gold text-xs px-3">追加</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activities.length === 0 && (
                <div className="text-xs text-gray-600 py-2">まだ活動記録がありません</div>
              )}
              {activities.map(a => (
                <div key={a.id} className="flex gap-2 text-xs">
                  <span className="text-gray-600 flex-shrink-0">{new Date(a.date).toLocaleDateString('ja-JP')}</span>
                  <span className="text-gray-300">{a.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Content */}
          <AIContentPanel prospect={prospect} />
        </div>

        {/* Right: AI Score */}
        <div className="space-y-4">
          <AIScoreCard prospect={prospect} />

          {/* Quick stats */}
          <div className="card p-4 space-y-2">
            <div className="text-xs font-medium text-gray-400 mb-1">集客力の現状</div>
            <div className="space-y-2.5">
              <Meter label="ホームページ" value={prospect.website_url ? 80 : 10} color="#60A5FA" />
              <Meter
                label="口コミ数"
                value={Math.min((prospect.review_count / 200) * 100, 100)}
                color="#34D399"
              />
              <Meter
                label="評価スコア"
                value={prospect.rating ? (prospect.rating / 5) * 100 : 0}
                color="#C9A84C"
              />
            </div>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="見込み客を編集" width="max-w-2xl">
        <ProspectForm initial={prospect} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
      </Modal>
    </div>
  )
}

function Meter({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}
