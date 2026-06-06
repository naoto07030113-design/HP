import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

function EnvStatus({ name, value }: { name: string; value: string | undefined }) {
  const isSet = Boolean(value)
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {isSet ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
        <code className="text-sm font-mono text-gray-700">{name}</code>
      </div>
      <Badge variant={isSet ? 'success' : 'danger'}>
        {isSet ? '設定済み' : '未設定'}
      </Badge>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-sm text-gray-500 mt-1">システム設定と環境変数の確認</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">環境変数の状態</CardTitle>
            <CardDescription>
              以下の環境変数が正しく設定されているか確認してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnvStatus
              name="NEXT_PUBLIC_SUPABASE_URL"
              value={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
            <EnvStatus
              name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
              value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
            />
            <EnvStatus
              name="SUPABASE_SERVICE_ROLE_KEY"
              value={process.env.SUPABASE_SERVICE_ROLE_KEY}
            />
            <EnvStatus
              name="OPENAI_API_KEY"
              value={process.env.OPENAI_API_KEY}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">システム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: 'システム名', value: 'Pre-Site Sales AI Engine' },
                { label: 'バージョン', value: 'v0.1.0 MVP' },
                { label: 'フレームワーク', value: 'Next.js 14 App Router' },
                { label: 'データベース', value: 'Supabase PostgreSQL' },
                { label: 'AI', value: 'OpenAI GPT-4' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              セットアップ手順
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Supabaseプロジェクトを作成し、<code>supabase/migrations/001_initial.sql</code> を実行</li>
              <li><code>.env.local</code> に環境変数を設定</li>
              <li>Supabase AuthでEmailプロバイダーを有効化</li>
              <li>Supabase Authでユーザーを作成しログイン</li>
              <li>事業者一覧からCSVインポートまたは手動で追加</li>
              <li>各事業者の「Web診断」タブでAI分析を実行</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
