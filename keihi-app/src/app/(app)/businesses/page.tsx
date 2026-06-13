'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useBusinessStore, businessStore } from '@/lib/business-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { Business } from '@/types/business'
import { cn } from '@/lib/utils'

export default function BusinessesPage() {
  const { businesses } = useBusinessStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  function openAdd() {
    setEditTarget(null)
    setName('')
    setIsActive(true)
    setFormOpen(true)
  }

  function openEdit(b: Business) {
    setEditTarget(b)
    setName(b.name)
    setIsActive(b.is_active)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editTarget) {
        await businessStore.update(editTarget.id, { name, is_active: isActive })
      } else {
        const maxOrder = businesses.reduce((m, b) => Math.max(m, b.sort_order), 0)
        await businessStore.create({ name, is_active: isActive, sort_order: maxOrder + 1 })
      }
      toast.success('保存しました')
      setFormOpen(false)
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">事業所管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">経費を分けて集計する事業所・店舗・拠点を登録します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          事業所を追加
        </Button>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="事業所がまだありません"
          description="複数の店舗や拠点がある場合は登録してください。1つだけの場合は登録なしでも利用できます（全社共通として記録）。"
          action={{ label: '事業所を追加', onClick: openAdd }}
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{b.name}</p>
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                b.is_active
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-gray-100 border-gray-200 text-gray-500',
              )}>
                {b.is_active ? '有効' : '無効'}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(b.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 追加・編集フォーム */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? '事業所を編集' : '事業所を追加'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>事業所名 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：本店、〇〇支店、訪問事業部"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>有効</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
              <Button type="submit" disabled={!name}>{editTarget ? '更新' : '追加'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="この事業所を削除しますか？"
        description="関連する経費・出納帳の記録は残り、事業所の指定が「全社共通」に変わります。"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await businessStore.delete(deleteId)
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
