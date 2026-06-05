import { useState, useMemo } from 'react'
import { useProspects } from '../contexts/ProspectContext.jsx'
import ProspectTable from '../components/prospects/ProspectTable.jsx'
import ProspectForm from '../components/prospects/ProspectForm.jsx'
import Modal from '../components/ui/Modal.jsx'
import { INDUSTRY_LIST, STATUS_LIST } from '../lib/utils.js'

export default function Prospects() {
  const { prospects, dispatch } = useProspects()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const q = search.toLowerCase()
      if (q && !p.store_name.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false
      if (filterIndustry && p.industry !== filterIndustry) return false
      if (filterStatus && p.status !== filterStatus) return false
      return true
    })
  }, [prospects, search, filterIndustry, filterStatus])

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(p) { setEditing(p); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null) }

  function handleSubmit(data) {
    dispatch({ type: editing ? 'UPDATE' : 'ADD', payload: data })
    closeModal()
  }

  function handleDelete(id) {
    setDeleteConfirm(id)
  }
  function confirmDelete() {
    dispatch({ type: 'DELETE', payload: deleteConfirm })
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="店舗名・住所で検索…"
            className="input-field pl-8"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>

        <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} className="input-field w-auto min-w-[100px]">
          <option value="">全業種</option>
          {INDUSTRY_LIST.map(i => <option key={i} value={i}>{i}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto min-w-[100px]">
          <option value="">全ステータス</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">{filtered.length}件</span>
          <button onClick={openAdd} className="btn-gold whitespace-nowrap">
            + 新規追加
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <ProspectTable prospects={filtered} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? '見込み客を編集' : '見込み客を追加'} width="max-w-2xl">
        <ProspectForm initial={editing} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="削除の確認">
        <p className="text-sm text-gray-300 mb-5">この見込み客を削除しますか？この操作は元に戻せません。</p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">キャンセル</button>
          <button onClick={confirmDelete} className="btn-danger flex-1">削除する</button>
        </div>
      </Modal>
    </div>
  )
}
