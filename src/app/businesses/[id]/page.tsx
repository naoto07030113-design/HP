import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft, BarChart2, FileText, Mail, Calendar,
  Globe, Phone, MapPin, Building2
} from 'lucide-react'
import { formatDate, getStatusLabel } from '@/lib/utils'

async function getBusiness(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/businesses/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  new: 'gray',
  contacted: 'default',
  negotiating: 'warning',
  contracted: 'success',
  lost: 'danger',
}

export default async function BusinessDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const business = await getBusiness(params.id)
  if (!business) notFound()

  const navLinks = [
    { href: `/businesses/${params.id}/analysis`, label: 'Web診断', icon: BarChart2 },
    { href: `/businesses/${params.id}/lp`, label: 'LP構成案', icon: FileText },
    { href: `/businesses/${params.id}/outreach`, label: '営業文', icon: Mail },
    { href: `/businesses/${params.id}/events`, label: '活動ログ', icon: Calendar },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/businesses">
              <ArrowLeft className="h-4 w-4 mr-1" />
              一覧へ
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <Badge variant={statusVariantMap[business.status] ?? 'gray'}>
                {getStatusLabel(business.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {business.industry ?? '業種未設定'} · 登録日: {formatDate(business.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <Icon className="h-6 w-6 text-green-700" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: '事業者名', value: business.name, icon: Building2 },
                { label: '業種', value: business.industry, icon: Building2 },
                { label: '住所', value: business.address, icon: MapPin },
                { label: '電話番号', value: business.phone, icon: Phone },
                { label: 'メール', value: business.email, icon: Mail },
                { label: 'HP URL', value: business.website_url, icon: Globe, isLink: true },
                { label: 'GoogleMap', value: business.google_map_url, icon: MapPin, isLink: true },
                { label: '情報取得元', value: business.source_name, icon: Building2 },
              ].map(({ label, value, icon: Icon, isLink }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {isLink && value ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:underline truncate block max-w-xs"
                        >
                          {value}
                        </a>
                      ) : (
                        value ?? '-'
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
