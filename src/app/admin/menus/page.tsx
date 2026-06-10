'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useClinicStore, menusStore } from '@/lib/clinic-store'
import { MenuForm } from '@/features/menus/components/MenuForm'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { VISIT_TYPE_LABELS } from '@/types/clinic'
import type { Menu, MenuFormData } from '@/types/clinic'

export default function MenusPage() {
  const store = useClinicStore()
  const [filterClinic, setFilterClinic] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Menu | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const displayMenus = filterClinic === 'all'
    ? store.menus
    : store.menus.filter((m) => m.clinic_id === filterClinic)

  function openEdit(m: Menu) { setEditTarget(m); setFormOpen(true) }
  function openAdd() { setEditTarget(null); setFormOpen(true) }

  async function handleSubmit(data: MenuFormData) {
    try {
      if (editTarget) await menusStore.update(editTarget.id, data)
      else await menusStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">メニュー管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">施術メニューの料金・時間・区分を管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          メニュー追加
        </Button>
      </div>

      <Select value={filterClinic} onValueChange={setFilterClinic}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="院で絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての院</SelectItem>
          {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {displayMenus.length === 0 ? (
        <EmptyState icon={BookOpen} title="メニューが登録されていません" action={{ label: 'メニューを追加', onClick: openAdd }} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {displayMenus.map((m) => {
            const clinic = store.clinics.find((c) => c.id === m.clinic_id)
            return (
              <div key={m.id} className="bg-white rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-green-900 flex-1 mr-2">{m.name}</p>
                  <div className="flex items-center gap-0.5 flex-shrink-0 -mt-0.5 -mr-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-800">¥{m.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{m.duration_min}分</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-sage-100 text-sage-700 border border-sage-200">
                      {VISIT_TYPE_LABELS[m.visit_type]}
                    </span>
                    <ActiveBadge isActive={m.is_active} />
                    {clinic && (
                      <span className="text-xs text-muted-foreground">{clinic.name}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MenuForm
        key={editTarget?.id ?? 'new'}
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} clinics={store.clinics}
        defaultClinicId={filterClinic !== 'all' ? filterClinic : undefined}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="メニューを削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await menusStore.delete(deleteId)
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
