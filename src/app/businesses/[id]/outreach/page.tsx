'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Zap, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Business, OutreachMessage } from '@/types'

function MessageCard({ message }: { message: OutreachMessage }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(
      `件名: ${message.subject}\n\n${message.body}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
    draft: 'secondary',
    sent: 'default',
    opened: 'warning',
    replied: 'success',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{message.subject}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(message.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={statusVariant[message.status] ?? 'secondary'}>
              {message.status}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {message.body}
        </p>
      </CardContent>
    </Card>
  )
}

export default function OutreachPage({ params }: { params: { id: string } }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [messages, setMessages] = useState<OutreachMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [bRes, mRes] = await Promise.all([
        fetch(`/api/businesses/${params.id}`),
        fetch(`/api/businesses/${params.id}/outreach`),
      ])
      if (bRes.ok) setBusiness(await bRes.json())
      if (mRes.ok) setMessages(await mRes.json())
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleGenerate() {
    if (!business) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: params.id,
          business_name: business.name,
          industry: business.industry,
          address: business.address,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '営業文生成に失敗しました')
      }
      const newMessage = await res.json()
      setMessages((prev) => [newMessage, ...prev])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '営業文生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/businesses/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">営業文生成</h1>
            <p className="text-sm text-gray-500">{business?.name ?? '読み込み中...'}</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            <Zap className="h-4 w-4 mr-2" />
            {generating ? '生成中...' : '営業メールを生成'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="py-12 text-center text-sm text-gray-500">読み込み中...</CardContent></Card>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">営業文がありません</h3>
              <p className="text-sm text-gray-500 mb-6">上のボタンからAIに営業メールを生成させてください</p>
              <Button onClick={handleGenerate} disabled={generating}>
                <Zap className="h-4 w-4 mr-2" />
                {generating ? '生成中...' : '営業メールを生成する'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
