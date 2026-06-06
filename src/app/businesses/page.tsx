import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Upload, Building2 } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase'
import { getStatusLabel } from '@/lib/utils'

async function getBusinesses() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, industry, status, phone, address')
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  new: 'gray',
  contacted: 'default',
  negotiating: 'warning',
  contracted: 'success',
  lost: 'danger',
}

export default async function BusinessesPage() {
  const businesses = await getBusinesses()

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">事業者一覧</h1>
            <p className="text-sm text-gray-500 mt-1">
              {businesses.length}件の事業者が登録されています
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/businesses/import">
                <Upload className="h-4 w-4 mr-2" />
                CSVインポート
              </Link>
            </Button>
            <Button asChild>
              <Link href="/businesses/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                新規追加
              </Link>
            </Button>
          </div>
        </div>

        {businesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                事業者がまだ登録されていません
              </h3>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                CSVファイルから一括インポートするか、手動で追加してください
              </p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/businesses/import">
                    <Upload className="h-4 w-4 mr-2" />
                    CSVインポート
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/businesses/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    手動で追加
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">事業者リスト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {businesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/businesses/${business.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                        <Building2 className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.name}</p>
                        <p className="text-xs text-gray-500">
                          {business.industry ?? '業種未設定'} · {business.address ?? '住所未設定'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariantMap[business.status] ?? 'gray'}>
                      {getStatusLabel(business.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
