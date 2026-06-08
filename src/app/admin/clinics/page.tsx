'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { useClinicStore, clinicsStore } from '@/lib/clinic-store'
import { ClinicForm } from '@/features/clinics/components/ClinicForm'
import { ActiveBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { Clinic, ClinicFormData } from '@/types/clinic'

export default function ClinicsPage() {
  const store = useClinicStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Clinic | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openEdit(c: Clinic) { setEditTarget(c); setFormOpen(true) }
  function openAdd() { setEditTarget(null); setFormOpen(true) }

  function handleSubmit(data: ClinicFormData) {
    if (editTarget) clinicsStore.update(editTarget.id, data)
    else clinicsStore.create(data)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">院管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">院の基本情報・営業時間を管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          院を追加
        </Button>
      </div>

      {store.clinics.length === 0 ? (
        <EmptyState icon={Building2} title="院が登録されていません" action={{ label: '院を追加', onClick: openAdd }} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {store.clinics.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">{c.name}</p>
                    <ActiveBadge isActive={c.is_active} className="mt-0.5" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" onClick={() => openEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {c.address && <p className="line-clamp-1">{c.address}</p>}
                {c.phone && <p>{c.phone}</p>}
                <p className="text-green-700 font-medium">
                  {c.open_time} - {c.close_time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClinicForm
        open={formOpen} onOpenChange={setFormOpen}
        initial={editTarget} onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="院を削除しますか？" description="関連するスタッフ・予約も削除されます"
        confirmLabel="削除" variant="destructive"
        onConfirm={() => { if (deleteId) clinicsStore.delete(deleteId); setDeleteId(null) }}
      />
    </div>
  )
}
