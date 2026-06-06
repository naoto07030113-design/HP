'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Business, LpVariant, LpSection } from '@/types'

function SectionCard({ section }: { section: LpSection }) {
  const [open, setOpen] = useState(true)
  const sectionLabels: Record<string, string> = {
    hero: 'ファーストビュー',
    reasons: '選ばれる理由',
    services: 'サービス紹介',
    strengths: '強み',
    faq: 'よくある質問',
    cta: 'CTA',
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <span className="text-sm font-medium text-gray-700">
          {sectionLabels[section.type] ?? section.type}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-gray-900">{section.title}</p>
          {Array.isArray(section.content) ? (
            <ul className="text-sm text-gray-600 space-y-1">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-600 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">{section.content}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function LpPage({ params }: { params: { id: string } }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [variants, setVariants] = useState<LpVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [bRes, vRes] = await Promise.all([
        fetch(`/api/businesses/${params.id}`),
        fetch(`/api/businesses/${params.id}/lp`),
      ])
      if (bRes.ok) setBusiness(await bRes.json())
      if (vRes.ok) setVariants(await vRes.json())
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleGenerate() {
    if (!business) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-lp', {
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
        throw new Error(d.error ?? 'LP生成に失敗しました')
      }
      const newVariant = await res.json()
      setVariants((prev) => [newVariant, ...prev])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'LP生成に失敗しました')
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
            <h1 className="text-2xl font-bold text-gray-900">LP構成案</h1>
            <p className="text-sm text-gray-500">{business?.name ?? '読み込み中...'}</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            <Zap className="h-4 w-4 mr-2" />
            {generating ? '生成中...' : 'LP構成案を生成'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="py-12 text-center text-sm text-gray-500">読み込み中...</CardContent></Card>
        ) : variants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">LP構成案がありません</h3>
              <p className="text-sm text-gray-500 mb-6">上のボタンからAIにLP構成案を生成させてください</p>
              <Button onClick={handleGenerate} disabled={generating}>
                <Zap className="h-4 w-4 mr-2" />
                {generating ? '生成中...' : 'LP構成案を生成する'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={variants[0]?.id}>
            <TabsList className="flex flex-wrap h-auto gap-1 p-1">
              {variants.map((v, i) => (
                <TabsTrigger key={v.id} value={v.id} className="text-xs">
                  案{i + 1} ({formatDate(v.created_at)})
                </TabsTrigger>
              ))}
            </TabsList>
            {variants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id} className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{variant.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          ターゲット: {variant.target_persona}
                        </p>
                      </div>
                      <Badge variant="secondary">{variant.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <p className="text-sm font-semibold text-green-800">メインコピー</p>
                      <p className="text-base text-green-900 mt-1 font-medium">{variant.main_copy}</p>
                    </div>
                    {variant.page_structure && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium text-gray-700">ページ構成</p>
                        {variant.page_structure.map((section, i) => (
                          <SectionCard key={i} section={section} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppLayout>
  )
}
