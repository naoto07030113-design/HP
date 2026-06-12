'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MessageSquare, Bell, CheckCircle2, Clock, AlertCircle, Save,
} from 'lucide-react'
import { useSettingsStore, settingsStore } from '@/lib/settings-store'
import { cn } from '@/lib/utils'

// モック送信履歴
const MOCK_HISTORY = [
  { id: 1, type: 'reminder', patient: '山本 太郎', channel: 'LINE', sentAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm').replace('HH:mm', '10:03'), status: 'delivered', message: '明日のご予約のご確認' },
  { id: 2, type: 'reminder', patient: '松本 花子', channel: 'LINE', sentAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm').replace('HH:mm', '10:03'), status: 'delivered', message: '明日のご予約のご確認' },
  { id: 3, type: 'reminder', patient: '渡辺 健', channel: 'SMS', sentAt: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm').replace('HH:mm', '10:01'), status: 'delivered', message: '明日のご予約のご確認' },
  { id: 4, type: 'thankyou', patient: '野村 敏', channel: 'LINE', sentAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm').replace('HH:mm', '21:15'), status: 'delivered', message: 'ご来院ありがとうございました' },
  { id: 5, type: 'reminder', patient: '池田 初子', channel: 'SMS', sentAt: format(subDays(new Date(), 3), 'yyyy-MM-dd HH:mm').replace('HH:mm', '10:04'), status: 'failed', message: '明日のご予約のご確認' },
]

const STATUS_ICONS = {
  delivered: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  pending:   <Clock className="w-3.5 h-3.5 text-amber-500" />,
  failed:    <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
}

const STATUS_LABELS = { delivered: '送信済', pending: '送信中', failed: '失敗' }

export default function CommunicationsPage() {
  const settings = useSettingsStore()
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings')

  function setS<K extends keyof typeof settings>(k: K, v: typeof settings[K]) {
    settingsStore.update({ [k]: v }).catch(() => {})
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">コミュニケーション設定</h1>
          <p className="text-sm text-muted-foreground mt-0.5">リマインダー・サンクスメッセージの自動送信設定</p>
        </div>
      </div>

      {/* API未設定バナー */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">実際の送信には外部API連携が必要です</p>
          <p className="text-xs leading-relaxed">
            LINE送信: LINE Messaging API キーを <code className="bg-amber-100 px-1 rounded">LINE_CHANNEL_ACCESS_TOKEN</code> に設定してください。
            SMS送信: Twilio または AWS SNS の認証情報が必要です。
            設定が完了するまでこのページの設定はUIのみで保存されます。
          </p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b">
        {[
          { key: 'settings', label: '送信設定', icon: Bell },
          { key: 'history', label: '送信履歴', icon: MessageSquare },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
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

      {activeTab === 'settings' && (
        <div className="space-y-5">
          {/* 予約リマインダー */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-green-900">予約リマインダー</h2>
                <p className="text-xs text-muted-foreground mt-0.5">予約日の前日または当日に自動送信</p>
              </div>
              <Switch
                checked={settings.reminderEnabled}
                onCheckedChange={(v) => setS('reminderEnabled', v)}
              />
            </div>

            {settings.reminderEnabled && (
              <div className="space-y-4 pl-1 border-l-2 border-green-100 ml-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">送信タイミング</Label>
                    <Select
                      value={String(settings.reminderDaysBefore)}
                      onValueChange={(v) => setS('reminderDaysBefore', Number(v))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">当日</SelectItem>
                        <SelectItem value="1">前日</SelectItem>
                        <SelectItem value="2">2日前</SelectItem>
                        <SelectItem value="3">3日前</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">送信時刻</Label>
                    <Input
                      type="time"
                      value={settings.reminderTimeOfDay}
                      onChange={(e) => setS('reminderTimeOfDay', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">送信チャンネル</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'lineReminderEnabled', label: 'LINE', desc: 'LINE Messaging API 連携' },
                      { key: 'smsReminderEnabled', label: 'SMS', desc: 'Twilio / AWS SNS 連携' },
                      { key: 'emailReminderEnabled', label: 'メール', desc: 'SMTP / SendGrid 連携' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50/60">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings[key as keyof typeof settings] as boolean}
                          onCheckedChange={(v) => setS(key as keyof typeof settings, v as never)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">リマインダーテンプレート</Label>
                  <p className="text-[10px] text-muted-foreground">
                    使用可能な変数: {`{{date}} {{time}} {{clinic}} {{staff}} {{menu}}`}
                  </p>
                  <Textarea
                    value={settings.reminderTemplate}
                    onChange={(e) => setS('reminderTemplate', e.target.value)}
                    rows={4}
                    className="text-sm font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* サンクスメッセージ */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-green-900">来院後サンクスメッセージ</h2>
              <p className="text-xs text-muted-foreground mt-0.5">来院ステータスに変更後に自動送信</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">テンプレート</Label>
              <Textarea
                value={settings.thankYouTemplate}
                onChange={(e) => setS('thankYouTemplate', e.target.value)}
                rows={3}
                className="text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className={cn('gap-2', saved && 'bg-green-600')}
            >
              <Save className="w-4 h-4" />
              {saved ? '保存しました' : '設定を保存'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50/60 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">送信日時</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">患者名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">チャンネル</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">内容</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_HISTORY.map((h) => (
                <tr key={h.id} className="hover:bg-green-50/40">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{h.sentAt}</td>
                  <td className="px-4 py-3 font-medium">{h.patient}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      h.channel === 'LINE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
                    )}>
                      {h.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{h.message}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      {STATUS_ICONS[h.status as keyof typeof STATUS_ICONS]}
                      {STATUS_LABELS[h.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t bg-green-50/60 text-xs text-muted-foreground">
            直近5件を表示（デモデータ）
          </div>
        </div>
      )}
    </div>
  )
}
