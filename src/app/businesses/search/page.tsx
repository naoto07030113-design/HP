'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search, MapPin, Star, Globe, GlobeIcon as NoWebIcon,
  Download, CheckSquare, Square, ExternalLink, AlertCircle,
  TrendingUp, Building2, ArrowLeft
} from 'lucide-react'
import type { PlaceResult } from '@/app/api/places/search/route'

const INDUSTRIES = [
  '飲食店', '美容院・理容院', 'エステ・リラクゼーション', '整骨院・接骨院',
  '歯科医院', 'クリニック・医院', '薬局', 'ホテル・旅館',
  '工務店・建設', '不動産', '学習塾・スクール', 'フィットネス・スポーツ',
  '弁護士・司法書士', '税理士・会計士', 'その他',
]

const PREFECTURES = [
  '東京都', '大阪府', '神奈川県', '愛知県', '福岡県', '北海道', '埼玉県', '千葉県',
  '兵庫県', '静岡県', '茨城県', '広島県', '京都府', '宮城県', '新潟県',
]

function priorityVariant(score: number): 'danger' | 'warning' | 'secondary' | 'gray' {
  if (score >= 0.8) return 'danger'
  if (score >= 0.6) return 'warning'
  if (score >= 0.4) return 'secondary'
  return 'gray'
}

function priorityLabel(score: number): string {
  if (score >= 0.8) return '最優先'
  if (score >= 0.6) return '優先'
  if (score >= 0.4) return '保留'
  return '対象外'
}

interface ImportResult {
  imported_count: number
  skipped_count: number
  error_count: number
  imported: string[]
  skipped: string[]
  errors: string[]
}

export default function PlacesSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [area, setArea] = useState('')
  const [industry, setIndustry] = useState('')
  const [minRating, setMinRating] = useState('4.0')
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchError, setSearchError] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch() {
    if (!keyword.trim() || !area.trim()) return
    setSearching(true)
    setSearchError('')
    setResults([])
    setSelected(new Set())
    setImportResult(null)
    setHasSearched(true)

    try {
      const res = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          area,
          min_rating: parseFloat(minRating),
          fetch_details: true,
        }),
      })
      let data: { error?: string; results?: PlaceResult[] }
      try {
        data = await res.json()
      } catch {
        throw new Error(`サーバーエラー (HTTP ${res.status})`)
      }
      if (!res.ok) throw new Error(data.error ?? `検索に失敗しました (HTTP ${res.status})`)
      setResults(data.results ?? [])
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : '検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map((r) => r.place_id)))
    }
  }

  async function handleImport() {
    const selectedPlaces = results.filter((r) => selected.has(r.place_id))
    if (selectedPlaces.length === 0) return

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/places/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selectedPlaces,
          industry,
          source_name: 'Google Places API',
        }),
      })
      let data: ImportResult & { error?: string }
      try {
        data = await res.json()
      } catch {
        throw new Error(`サーバーエラー (HTTP ${res.status})`)
      }
      if (!res.ok) throw new Error(data.error ?? `インポートに失敗しました (HTTP ${res.status})`)
      setImportResult(data)
      // Remove imported from selection
      const importedNames = new Set(data.imported as string[])
      const newSelected = new Set<string>()
      results.forEach((r) => {
        if (!importedNames.has(r.name) && selected.has(r.place_id)) {
          newSelected.add(r.place_id)
        }
      })
      setSelected(newSelected)
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : 'インポートに失敗しました')
    } finally {
      setImporting(false)
    }
  }

  const allSelected = results.length > 0 && selected.size === results.length
  const noWebsiteCount = results.filter((r) => !r.has_website).length
  const highPriorityCount = results.filter((r) => r.priority_score >= 0.8).length

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/businesses">
              <ArrowLeft className="h-4 w-4 mr-1" />
              一覧へ
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Places 店舗検索</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              評価4.0以上の店舗を検索してHP有無を判定し、事業者データベースに登録します
            </p>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-green-700" />
              検索条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">業種・キーワード</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="例：美容院、歯科医院"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">エリア</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="例：東京都新宿区"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <Label>最低評価</Label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3.5">3.5以上</SelectItem>
                    <SelectItem value="4.0">4.0以上</SelectItem>
                    <SelectItem value="4.5">4.5以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>業種カテゴリ（インポート用）</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleSearch} disabled={!keyword || !area || searching}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? '検索中...' : '検索する'}
              </Button>
              <div className="flex flex-wrap gap-1">
                {PREFECTURES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setArea(p)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {searchError && (
          <div className="flex gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {searchError}
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm">
            <p className="font-semibold text-green-800 mb-2">インポート完了</p>
            <div className="flex gap-4 text-green-700">
              <span>登録: {importResult.imported_count}件</span>
              <span>スキップ（重複）: {importResult.skipped_count}件</span>
              {importResult.error_count > 0 && (
                <span className="text-red-600">エラー: {importResult.error_count}件</span>
              )}
            </div>
            {importResult.imported_count > 0 && (
              <div className="mt-2">
                <Link href="/businesses" className="text-green-700 underline text-xs">
                  事業者一覧で確認する →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {hasSearched && !searching && (
          <>
            {results.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-gray-500">
                  検索結果が見つかりませんでした。キーワードやエリアを変えてお試しください。
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="text-gray-600">{results.length}件取得</span>
                    <span className="text-red-600 font-medium">最優先: {highPriorityCount}件</span>
                    <span className="text-orange-600">HP未保有: {noWebsiteCount}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={toggleAll}>
                      {allSelected ? (
                        <><CheckSquare className="h-4 w-4 mr-1.5" />全解除</>
                      ) : (
                        <><Square className="h-4 w-4 mr-1.5" />全選択</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleImport}
                      disabled={selected.size === 0 || importing}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      {importing ? 'インポート中...' : `選択した${selected.size}件をインポート`}
                    </Button>
                  </div>
                </div>

                {/* Results Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="w-10 px-4 py-3 text-left"></th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[180px]">店舗名</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[160px]">住所</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">評価</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">HP</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">HP未保有確率</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">優先度</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Webスコア</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[100px]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {results.map((place) => {
                            const isSelected = selected.has(place.place_id)
                            return (
                              <tr
                                key={place.place_id}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-green-50' : ''}`}
                                onClick={() => toggleSelect(place.place_id)}
                              >
                                <td className="px-4 py-3">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                                    {isSelected && <span className="text-white text-xs">✓</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{place.name}</p>
                                  {place.phone && (
                                    <p className="text-xs text-gray-400 mt-0.5">{place.phone}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-gray-600 text-xs leading-relaxed">{place.formatted_address}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                                    <span className="font-semibold text-gray-900">{place.rating.toFixed(1)}</span>
                                  </div>
                                  <p className="text-xs text-gray-400">{place.user_ratings_total}件</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {place.has_website ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Globe className="h-4 w-4 text-green-600" />
                                      <span className="text-xs text-green-600">あり</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <NoWebIcon className="h-4 w-4 text-red-400" />
                                      <span className="text-xs text-red-500">なし</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-sm font-bold ${place.no_hp_probability >= 0.8 ? 'text-red-600' : place.no_hp_probability >= 0.5 ? 'text-orange-500' : 'text-gray-600'}`}>
                                    {Math.round(place.no_hp_probability * 100)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={priorityVariant(place.priority_score)}>
                                    {priorityLabel(place.priority_score)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-gray-700 font-medium">
                                      {Math.round(place.web_presence_score * 100)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={place.google_map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-green-700 hover:underline"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    地図
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                  {place.website && (
                                    <a
                                      href={place.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                                    >
                                      <Globe className="h-3 w-3" />
                                      HP
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="danger" className="text-xs">最優先</Badge>
                    <span>優先度スコア 80%以上</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="warning" className="text-xs">優先</Badge>
                    <span>60〜79%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">保留</Badge>
                    <span>40〜59%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="gray" className="text-xs">対象外</Badge>
                    <span>39%以下</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
