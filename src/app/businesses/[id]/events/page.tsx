'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, PlusCircle, Clock } from 'lucide-react'
import { formatDateTime, getEventTypeLabel } from '@/lib/utils'
import type { OutreachEvent } from '@/types'

const EVENT_TYPES = [
  { value: 'sent', label: '送信' },
  { value: 'opened', label: '開封' },
  { value: 'replied', label: '返信' },
  { value: 'meeting', label: '商談' },
  { value: 'estimate', label: '見積' },
  { value: 'contracted', label: '契約' },
  { value: 'lost', label: '失注' },
]

const eventColorMap: Record<string, string> = {
  sent: 'bg-blue-400',
  opened: 'bg-cyan-400',
  replied: 'bg-purple-400',
  meeting: 'bg-yellow-400',
  estimate: 'bg-orange-400',
  contracted: 'bg-green-500',
  lost: 'bg-red-400',
}

export default function EventsPage({ params }: { params: { id: string } }) {
  const [events, setEvents] = useState<OutreachEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ event_type: '', event_note: '' })

  async function loadEvents() {
    const res = await fetch(`/api/events?business_id=${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setEvents(data)
    }
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: params.id, ...form }),
    })
    setForm({ event_type: '', event_note: '' })
    setShowForm(false)
    await loadEvents()
    setSubmitting(false)
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/businesses/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">活動ログ</h1>
            <p className="text-sm text-gray-500">営業活動の記録</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            記録を追加
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">活動を記録</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>イベント種別 <span className="text-red-500">*</span></Label>
                  <Select
                    onValueChange={(v) => setForm((f) => ({ ...f, event_type: v }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((et) => (
                        <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>メモ</Label>
                  <Textarea
                    value={form.event_note}
                    onChange={(e) => setForm((f) => ({ ...f, event_note: e.target.value }))}
                    placeholder="活動内容のメモ..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={submitting || !form.event_type}>
                    {submitting ? '保存中...' : '保存'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">活動履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-8">読み込み中...</p>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">活動記録がありません</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex gap-4 relative">
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full ${
                          eventColorMap[event.event_type] ?? 'bg-gray-400'
                        } flex items-center justify-center z-10`}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(event.occurred_at)}
                          </span>
                        </div>
                        {event.event_note && (
                          <p className="text-sm text-gray-600 mt-1">{event.event_note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
