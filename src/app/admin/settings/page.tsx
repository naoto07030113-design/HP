'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2, CalendarDays, Database, Save, RotateCcw, Download, CheckCircle2, ShieldCheck,
} from 'lucide-react'
import { useSettingsStore, settingsStore } from '@/lib/settings-store'
import { resetDemoData } from '@/lib/clinic-store'
import { useClinicStore } from '@/lib/clinic-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PermissionGuard } from '@/components/common/PermissionGuard'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'general',  label: '一般設定',  icon: Building2 },
  { key: 'booking',  label: '予約設定',  icon: CalendarDays },
  { key: 'access',   label: 'アクセス権限', icon: ShieldCheck },
  { key: 'data',     label: 'データ管理', icon: Database },
] as const

type TabKey = typeof TABS[number]['key']

export default function SettingsPage() {
  const settings = useSettingsStore()
  const { clinics } = useClinicStore()
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const [saved, setSaved] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function setS<K extends keyof typeof settings>(k: K, v: typeof settings[K]) {
    settingsStore.update({ [k]: v }).catch(() => {})
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    resetDemoData()
    setResetOpen(false)
  }

  function exportJSON() {
    const data = {
      settings: settingsStore.get(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `imc-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PermissionGuard allowedRoles={['admin']}>
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="page-title">システム設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">システム全体の動作設定を管理します</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === key
                ? 'border-green-700 text-green-900'
                : 'border-transparent text-muted-foreground hover:text-green-800',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 一般設定 */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900">医院情報</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>法人名 / 医院名</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setS('companyName', e.target.value)}
                  placeholder="有限会社イトーメディカルケア"
                />
              </div>
              <div className="space-y-1.5">
                <Label>タイムゾーン</Label>
                <Select value={settings.timezone} onValueChange={(v) => setS('timezone', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo（JST）</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900">院一覧</h2>
            <p className="text-xs text-muted-foreground">院の詳細設定は「院管理」ページで行います</p>
            <div className="divide-y">
              {clinics.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.open_time} - {c.close_time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className={cn('gap-2', saved && 'bg-green-600')}>
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '保存しました' : '保存'}
            </Button>
          </div>
        </div>
      )}

      {/* 予約設定 */}
      {activeTab === 'booking' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-5">
            <h2 className="font-semibold text-green-900">予約受付ルール</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>最大予約可能日数（今日から何日先まで）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={1} max={365}
                    value={settings.maxAdvanceBookingDays}
                    onChange={(e) => setS('maxAdvanceBookingDays', Number(e.target.value))}
                    className="h-9 w-24"
                  />
                  <span className="text-sm text-muted-foreground">日前まで</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>キャンセル期限（何時間前まで）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0} max={168}
                    value={settings.minCancellationHours}
                    onChange={(e) => setS('minCancellationHours', Number(e.target.value))}
                    className="h-9 w-24"
                  />
                  <span className="text-sm text-muted-foreground">時間前まで</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>予約スロット間隔</Label>
                <Select
                  value={String(settings.slotIntervalMin)}
                  onValueChange={(v) => setS('slotIntervalMin', Number(v))}
                >
                  <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15分</SelectItem>
                    <SelectItem value="30">30分</SelectItem>
                    <SelectItem value="60">60分</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className={cn('gap-2', saved && 'bg-green-600')}>
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '保存しました' : '保存'}
            </Button>
          </div>
        </div>
      )}

      {/* データ管理 */}
      {/* アクセス権限 */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900">スタッフ権限について</h2>
            <p className="text-sm text-muted-foreground">
              各ユーザーのアクセス権限は Supabase ダッシュボードでユーザーメタデータとして設定します。
            </p>
            <div className="space-y-3">
              {[
                { role: 'admin',        label: '管理者',   desc: '全機能へのフルアクセス（デフォルト）' },
                { role: 'staff',        label: 'スタッフ', desc: '予約・患者・カルテ・会計・シフト管理。分析・レポートも可' },
                { role: 'receptionist', label: '受付',     desc: '当日受付・予約カレンダー・予約一覧・患者情報のみ' },
              ].map(({ role, label, desc }) => (
                <div key={role} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <ShieldCheck className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{label} <code className="text-xs bg-white border px-1 rounded">{role}</code></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-green-900">設定方法</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Supabase ダッシュボード → Authentication → Users を開く</li>
              <li>対象ユーザーをクリックし「Edit User」を選択</li>
              <li>「User Metadata」に以下を入力して保存</li>
            </ol>
            <div className="bg-green-50/60 rounded-lg p-3 font-mono text-xs">
              {'{ "role": "staff" }'}
            </div>
            <p className="text-xs text-muted-foreground">
              設定可能な値: <code>admin</code> / <code>staff</code> / <code>receptionist</code><br />
              メタデータが未設定のユーザーは自動的に <code>admin</code> として扱われます。
            </p>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900">データエクスポート</h2>
            <p className="text-sm text-muted-foreground">
              設定データをJSONファイルとして書き出します。
              予約・患者・会計のCSV出力は「CSV出力」ページで行います。
            </p>
            <Button variant="outline" className="gap-2" onClick={exportJSON}>
              <Download className="w-4 h-4" />
              設定をJSONでエクスポート
            </Button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900">暗号化ストレージ</h2>
            <p className="text-sm text-muted-foreground">
              全データはAES-256-GCMで暗号化してブラウザのlocalStorageに保存されています。
              <br />
              環境変数 <code className="bg-slate-100 px-1 rounded text-xs">NEXT_PUBLIC_ENCRYPTION_KEY</code> に強力なランダム文字列を設定してください。
            </p>
            <div className="bg-green-50/60 rounded-lg p-3 font-mono text-xs text-muted-foreground">
              openssl rand -base64 32
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-5 space-y-3">
            <h2 className="font-semibold text-red-800">デモデータリセット</h2>
            <p className="text-sm text-red-700">
              全ての予約・患者・会計・シフトデータをデモデータに戻します。
              この操作は取り消せません。
            </p>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 gap-2"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="w-4 h-4" />
              デモデータに戻す
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="デモデータにリセットしますか？"
        description="全ての予約・患者・会計・シフトがデモデータに戻ります。この操作は取り消せません。"
        confirmLabel="リセット"
        variant="destructive"
        onConfirm={handleReset}
      />
    </div>
    </PermissionGuard>
  )
}
