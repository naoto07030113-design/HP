'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react'
import { useCardStore, cardStore } from '@/lib/card-store'
import { useBusinessStore } from '@/lib/business-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { Card } from '@/types/card'

export default function CardsPage() {
  const { cards } = useCardStore()
  const { businesses } = useBusinessStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Card | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [last4, setLast4] = useState('')
  const [label, setLabel] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  function businessName(id: string | null): string {
    if (id === null) return '未割り当て'
    return businesses.find((b) => b.id === id)?.name ?? '未割り当て'
  }

  function openAdd() {
    setEditTarget(null)
    setLast4('')
    setLabel('')
    setBusinessId(null)
    setFormOpen(true)
  }

  function openEdit(c: Card) {
    setEditTarget(c)
    setLast4(c.last4)
    setLabel(c.label)
    setBusinessId(c.business_id)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const normalized = last4.replace(/\D/g, '').slice(-4)
    if (normalized.length !== 4) {
      toast.error('下4桁は数字4桁で入力してください')
      return
    }
    try {
      if (editTarget) {
        await cardStore.update(editTarget.id, { last4: normalized, label, business_id: businessId })
      } else {
        await cardStore.create({ last4: normalized, label, business_id: businessId })
      }
      toast.success('保存しました')
      setFormOpen(false)
    } catch (err) {
      toast.error(err instanceof Error && err.message.includes('duplicate') ? 'その下4桁は既に登録されています' : '保存に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">カード管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">クレジットカードの下4桁ごとに事業所を割り当て、経費を自動仕分けします</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          カードを追加
        </Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="カードがまだ登録されていません"
          description="カードの下4桁と事業所を登録すると、レシートやカード明細から自動で事業所に仕分けされます。"
          action={{ label: 'カードを追加', onClick: openAdd }}
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {cards.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium font-mono">···· {c.last4}</p>
                {c.label && <p className="text-xs text-muted-foreground">{c.label}</p>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 border-green-200 text-green-800">
                {businessName(c.business_id)}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(c.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'カードを編集' : 'カードを追加'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>下4桁 *</Label>
                <Input
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(-4))}
                  placeholder="8422"
                  className="font-mono"
                  maxLength={4}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>事業所</Label>
                <Select value={businessId ?? '__none__'} onValueChange={(v) => setBusinessId(v === '__none__' ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">未割り当て</SelectItem>
                    {businesses.filter((b) => b.is_active).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>メモ（任意）</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：本部カード、楽天カード" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
              <Button type="submit">{editTarget ? '更新' : '追加'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="このカードを削除しますか？"
        description="既に登録された経費の仕分けはそのまま残ります。"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await cardStore.delete(deleteId)
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
