'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Zap, BarChart2, AlertCircle } from 'lucide-react'
import type { Business, WebPresenceScore } from '@/types'

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score != null ? Math.round(score * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{score != null ? `${pct}%` : '-'}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [score, setScore] = useState<WebPresenceScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [competitorInfo, setCompetitorInfo] = useState('')

  useEffect(() => {
    async function load() {
      const [bRes, sRes] = await Promise.all([
        fetch(`/api/businesses/${params.id}`),
        fetch(`/api/businesses/${params.id}/scores`),
      ])
      if (bRes.ok) setBusiness(await bRes.json())
      if (sRes.ok) {
        const scores = await sRes.json()
        if (scores.length > 0) setScore(scores[0])
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleAnalyze() {
    if (!business) return
    setAnalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/ai/analyze-web-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: params.id,
          business_name: business.name,
          industry: business.industry,
          address: business.address,
          website_url: business.website_url,
          google_map_url: business.google_map_url,
          review_text: reviewText,
          competitor_info: competitorInfo,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '診断に失敗しました')
      }
      const data = await res.json()
      setScore(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '診断に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  const noHpProb = score?.no_hp_probability
  const priorityColor =
    noHpProb != null && noHpProb >= 0.8
      ? 'danger'
      : noHpProb != null && noHpProb >= 0.6
      ? 'warning'
      : 'success'

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Web診断</h1>
            <p className="text-sm text-gray-500">{business?.name ?? '読み込み中...'}</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-gray-500">
              読み込み中...
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  AI Web診断を実行
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>口コミ情報（任意）</Label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Googleマップの口コミなどを貼り付けてください..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>競合情報（任意）</Label>
                  <Textarea
                    value={competitorInfo}
                    onChange={(e) => setCompetitorInfo(e.target.value)}
                    placeholder="競合他社の情報を入力してください..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
                  {analyzing ? 'AI診断中...' : 'Web診断を実行する'}
                </Button>
              </CardContent>
            </Card>

            {score && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-green-600" />
                        診断結果
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityColor}>
                          HP未保有確率 {Math.round((score.no_hp_probability ?? 0) * 100)}%
                        </Badge>
                        <Badge variant={score.has_official_website ? 'success' : 'danger'}>
                          {score.has_official_website ? 'HP あり' : 'HP なし'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScoreBar label="Webサイト品質スコア" score={score.website_quality_score} />
                    <ScoreBar label="SNSプレゼンス" score={score.sns_presence_score} />
                    <ScoreBar label="口コミ量スコア" score={score.review_volume_score} />
                    <ScoreBar label="競合差分スコア" score={score.competitor_gap_score} />
                    <ScoreBar label="総合Webプレゼンス" score={score.web_presence_score} />
                    <ScoreBar label="信頼度" score={score.confidence_score} />
                  </CardContent>
                </Card>

                {score.reasoning && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AIの分析根拠</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {score.reasoning}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
