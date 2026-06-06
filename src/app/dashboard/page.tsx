import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, TrendingUp, FileText, Mail } from 'lucide-react'

async function getDashboardStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fallback
  }
  return {
    total_businesses: 0,
    high_priority_count: 0,
    lp_generated_count: 0,
    email_generated_count: 0,
    negotiation_count: 0,
    contracted_count: 0,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: '総事業者数',
      value: stats.total_businesses,
      description: '登録済み事業者',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: '最優先リード',
      value: stats.high_priority_count,
      description: 'スコア80%以上',
      icon: TrendingUp,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'LP生成済み',
      value: stats.lp_generated_count,
      description: 'ランディングページ',
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'メール生成済み',
      value: stats.email_generated_count,
      description: 'アウトリーチメール',
      icon: Mail,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">営業活動の概況を確認できます</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ステータス別内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: '新規', count: 0, color: 'bg-gray-400' },
                  { label: '連絡済', count: 0, color: 'bg-blue-400' },
                  { label: '商談中', count: stats.negotiation_count, color: 'bg-yellow-400' },
                  { label: '契約済', count: stats.contracted_count, color: 'bg-green-400' },
                  { label: '失注', count: 0, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">はじめに</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>このシステムでは以下の機能が利用できます：</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>CSVから事業者を一括インポート</li>
                  <li>AIによるWeb存在感スコアリング</li>
                  <li>ランディングページの自動生成</li>
                  <li>アウトリーチメールの自動生成</li>
                  <li>営業活動の記録・管理</li>
                </ol>
                <p className="text-green-700 font-medium mt-4">
                  まず「事業者一覧」から事業者を追加してください。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
