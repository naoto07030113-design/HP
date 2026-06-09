'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Users } from 'lucide-react'
import { useClinicStore, staffStore } from '@/lib/clinic-store'
import { StaffForm } from '@/features/staff/components/StaffForm'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { Staff, StaffFormData } from '@/types/clinic'

export default function StaffPage() {
  const store = useClinicStore()
  const [filterClinic, setFilterClinic] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Staff | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const displayStaff = filterClinic === 'all'
    ? store.staff
    : store.staff.filter((s) => s.clinic_id === filterClinic)

  function openEdit(s: Staff) { setEditTarget(s); setFormOpen(true) }
  function openAdd() { setEditTarget(null); setFormOpen(true) }

  async function handleSubmit(data: StaffFormData) {
    try {
      if (editTarget) await staffStore.update(editTarget.id, data)
      else await staffStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">スタッフ管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">スタッフの所属・職種・予約受付設定を管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          スタッフ追加
        </Button>
      </div>

      {/* フィルター */}
      <Select value={filterClinic} onValueChange={setFilterClinic}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="院で絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての院</SelectItem>
          {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {displayStaff.length === 0 ? (
        <EmptyState icon={Users} title="スタッフが登録されていません" action={{ label: 'スタッフを追加', onClick: openAdd }} />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50">
                <th className="text-left px-4 py-3 text-green-900 font-semibold">スタッフ名</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">所属院</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">職種</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">予約受付</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">表示</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {displayStaff.map((s) => {
                const clinic = store.clinics.find((c) => c.id === s.clinic_id)
                return (
                  <tr key={s.id} className="hover:bg-green-50/30">
                    <td className="px-4 py-3 font-medium text-green-900">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{clinic?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.role ?? '-'}</td>
                    <td className="px-4 py-3">
                      <ActiveBadge isActive={s.is_bookable} activeLabel="受付中" inactiveLabel="停止" />
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge isActive={s.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(s)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />編集
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <StaffForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} clinics={store.clinics}
        defaultClinicId={filterClinic !== 'all' ? filterClinic : undefined}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="スタッフを削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await staffStore.delete(deleteId)
              toast.success('削除しました')
            } catch {
              toast.error('削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
