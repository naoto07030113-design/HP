'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Pencil, Trash2, Megaphone, ArrowUp, ArrowDown,
  ImageIcon, Paperclip, X as XIcon,
} from 'lucide-react'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { useClinicStore } from '@/lib/clinic-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'
import type { Announcement, AnnouncementFormData, AnnouncementType, AnnouncementScope } from '@/types/announcement'
import { ANNOUNCEMENT_TYPE_LABELS, ANNOUNCEMENT_TYPE_COLORS } from '@/types/announcement'
import { cn } from '@/lib/utils'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const IN_30 = format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd')

const DEFAULT_FORM: AnnouncementFormData = {
  banner_mode: 'text', title: '', body: null, image_url: null, image_alt: null,
  attachment_name: null,
  scope: 'company', clinic_id: null, type: 'normal',
  start_date: TODAY, end_date: IN_30, is_active: true,
  display_order: 0, link_url: null, link_label: null,
}

// 画像を圧縮してbase64に変換（max1000px, JPEG品質0.85）
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1000
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')) }
    img.src = url
  })
}

export default function AnnouncementsPage() {
  const items = useAnnouncementsStore()
  const store = useClinicStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<AnnouncementFormData>(DEFAULT_FORM)
  const [imgError, setImgError] = useState('')

  const sorted = [...items].sort((a, b) => a.display_order - b.display_order)

  function openAdd() {
    setEditTarget(null)
    setForm({ ...DEFAULT_FORM, display_order: items.length })
    setImgError('')
    setFormOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditTarget(a)
    setForm({
      banner_mode: a.banner_mode, title: a.title, body: a.body,
      image_url: a.image_url, image_alt: a.image_alt,
      attachment_name: a.attachment_name,
      scope: a.scope, clinic_id: a.clinic_id,
      type: a.type, start_date: a.start_date, end_date: a.end_date,
      is_active: a.is_active, display_order: a.display_order,
      link_url: a.link_url, link_label: a.link_label,
    })
    setImgError('')
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editTarget) await announcementsStore.update(editTarget.id, form)
      else await announcementsStore.create(form)
    } catch {
      // silently ignore — optimistic update already applied
    }
    setFormOpen(false)
  }

  function setF<K extends keyof AnnouncementFormData>(k: K, v: AnnouncementFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgError('')
    try {
      const base64 = await compressImage(file)
      setF('image_url', base64)
      setF('image_alt', file.name.replace(/\.[^.]+$/, ''))
      setF('banner_mode', 'image')
    } catch {
      setImgError('画像の読み込みに失敗しました')
    }
    e.target.value = ''
  }

  function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setF('attachment_name', file.name)
    e.target.value = ''
  }

  const activeAnnouncements = announcementsStore.getActive('company')

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">お知らせ管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">患者向け予約ページに表示するバナーを管理します</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          お知らせ追加
        </Button>
      </div>

      {/* バナープレビュー */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">バナープレビュー（公開中）</p>
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <AnnouncementBanners announcements={activeAnnouncements} />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={Megaphone} title="お知らせが登録されていません" action={{ label: 'お知らせを追加', onClick: openAdd }} />
      ) : (
        <div className="space-y-2">
          {sorted.map((a, idx) => (
            <div
              key={a.id}
              className={cn('bg-white rounded-xl border shadow-sm p-4', !a.is_active && 'opacity-60')}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={() => announcementsStore.reorder(idx, Math.max(0, idx - 1))}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => announcementsStore.reorder(idx, Math.min(sorted.length - 1, idx + 1))}
                    disabled={idx === sorted.length - 1}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {a.image_url && (
                  <img
                    src={a.image_url}
                    alt={a.image_alt ?? ''}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ANNOUNCEMENT_TYPE_COLORS[a.type])}>
                      {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border">
                      {a.scope === 'company' ? '全社共通' : store.clinics.find((c) => c.id === a.clinic_id)?.name ?? a.clinic_id}
                    </span>
                    {a.attachment_name && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {a.attachment_name}
                      </span>
                    )}
                    {!a.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">非公開</span>
                    )}
                  </div>
                  <p className="font-semibold text-green-900 line-clamp-1">{a.title}</p>
                  {a.body && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{a.start_date} 〜 {a.end_date}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch
                    checked={a.is_active}
                    onCheckedChange={(v) => announcementsStore.update(a.id, { is_active: v }).catch(() => {})}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フォームダイアログ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'お知らせを編集' : 'お知らせを追加'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>タイプ</Label>
                <Select value={form.type} onValueChange={(v) => setF('type', v as AnnouncementType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ANNOUNCEMENT_TYPE_LABELS) as [AnnouncementType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>表示対象</Label>
                <Select value={form.scope} onValueChange={(v) => setF('scope', v as AnnouncementScope)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">全社共通</SelectItem>
                    <SelectItem value="clinic">特定院</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.scope === 'clinic' && (
              <div className="space-y-1.5">
                <Label>院を選択</Label>
                <Select value={form.clinic_id ?? ''} onValueChange={(v) => setF('clinic_id', v || null)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="院を選択" /></SelectTrigger>
                  <SelectContent>
                    {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>タイトル *</Label>
              <Input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="お知らせのタイトル" required />
            </div>

            <div className="space-y-1.5">
              <Label>本文</Label>
              <Textarea
                value={form.body ?? ''}
                onChange={(e) => setF('body', e.target.value || null)}
                placeholder="詳細説明..."
                rows={3}
              />
            </div>

            {/* 画像アップロード --- labelで直接input wrapping（Dialogでも確実に動く） */}
            <div className="space-y-1.5">
              <Label>バナー画像</Label>
              {form.image_url ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={form.image_url}
                      alt={form.image_alt ?? ''}
                      className="rounded-lg border border-border object-cover h-32 max-w-full"
                    />
                    <button
                      type="button"
                      onClick={() => { setF('image_url', null); setF('image_alt', null); setF('banner_mode', 'text') }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <Input
                    value={form.image_alt ?? ''}
                    onChange={(e) => setF('image_alt', e.target.value || null)}
                    placeholder="画像の説明文（任意）"
                  />
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-3 text-sm border-2 border-dashed border-border rounded-lg hover:bg-muted/50 hover:border-green-300 transition-colors text-muted-foreground w-full cursor-pointer">
                  <ImageIcon className="w-4 h-4 flex-shrink-0" />
                  <span>クリックして画像を選択（JPG / PNG / WebP）</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              {imgError && <p className="text-xs text-destructive">{imgError}</p>}
            </div>

            {/* ファイル添付 */}
            <div className="space-y-1.5">
              <Label>ファイル添付</Label>
              {form.attachment_name ? (
                <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg bg-blue-50">
                  <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-800 flex-1 truncate">{form.attachment_name}</span>
                  <button
                    type="button"
                    onClick={() => setF('attachment_name', null)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-3 text-sm border-2 border-dashed border-border rounded-lg hover:bg-muted/50 hover:border-green-300 transition-colors text-muted-foreground w-full cursor-pointer">
                  <Paperclip className="w-4 h-4 flex-shrink-0" />
                  <span>クリックしてファイルを添付（PDF / Word / Excel）</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    className="sr-only"
                    onChange={handleFileAttach}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ボタン文言</Label>
                <Input value={form.link_label ?? ''} onChange={(e) => setF('link_label', e.target.value || null)}
                  placeholder="詳細はこちら" />
              </div>
              <div className="space-y-1.5">
                <Label>リンクURL</Label>
                <Input value={form.link_url ?? ''} onChange={(e) => setF('link_url', e.target.value || null)}
                  placeholder="https://..." type="url" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>表示開始日</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setF('start_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>表示終了日</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setF('end_date', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="ann-active" checked={form.is_active} onCheckedChange={(v) => setF('is_active', v)} />
              <Label htmlFor="ann-active" className="cursor-pointer">公開する</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
              <Button type="submit">{editTarget ? '更新' : '追加'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="お知らせを削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={() => { if (deleteId) announcementsStore.delete(deleteId).catch(() => {}); setDeleteId(null) }}
      />
    </div>
  )
}
