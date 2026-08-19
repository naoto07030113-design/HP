'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Users, CalendarCheck, Repeat2, Receipt, UserX, PhoneCall } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useSettingsStore } from '@/lib/settings-store'
import { useAnalyticsReport } from '@/features/reports/hooks/useAnalyticsReport'
import { cn } from '@/lib/utils'

// ── シンプルな棒グラフ ────────────────────────────────────
function BarChart({
  data,
  color = 'bg-green-600',
  formatVal = (v: number) => v.toLocaleString(),
}: {
  data: { label: string; value: number }[]
  color?: string
  formatVal?: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-px h-28 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-0.5 group cursor-default"
          title={`${d.label}: ${formatVal(d.value)}`}
        >
          <div
            className={cn('w-full rounded-t-sm transition-all', color, d.value === 0 ? 'opacity-15' : 'opacity-85 group-hover:opacity-100')}
            style={{ height: `${Math.max(2, (d.value / max) * 88)}px` }}
          />
          {d.label && (
            <span className="text-[8px] text-muted-foreground leading-none whitespace-nowrap">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── 変化率バッジ ────────────────────────────────────
function ChangeBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null
  const pct = Math.round((current - prev) / prev * 100)
  const up = pct >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      up ? 'text-green-600' : 'text-red-500',
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

// ── ドーナツ風ステータス内訳 ────────────────────────────────────
function StatusBar({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">データなし</p>
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {data.map((d) => (
          <div
            key={d.label}
            className={d.color}
            style={{ width: `${(d.count / total) * 100}%` }}
            title={`${d.label}: ${d.count}件`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', d.color)} />
            <span className="text-xs text-muted-foreground">{d.label}</span>
            <span className="text-xs font-semibold">{d.count}</span>
            <span className="text-xs text-muted-foreground">({Math.round(d.count / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  visited:   { label: '来院済',        color: 'bg-green-500' },
  confirmed: { label: '予約確定',      color: 'bg-blue-400' },
  cancelled: { label: 'キャンセル',    color: 'bg-gray-300' },
  no_show:   { label: '無断キャンセル', color: 'bg-red-400' },
}

export default function AnalyticsPage() {
  useSettingsStore()
  const { clinics } = useClinicStore()
  const [selectedClinic, setSelectedClinic] = useState('all')
  const [inactiveDays, setInactiveDays] = useState(60)

  // 集計はサーバー側で行う（画面に届くのは結果だけ）
  const { report, loading, error } = useAnalyticsReport({
    clinicId: selectedClinic === 'all' ? null : selectedClinic,
    inactiveDays,
  })

  const { kpi, days30, staffStats, menuRanking, inactivePatients } = report
  const statusBreakdown = useMemo(
    () => report.statusBreakdown.map((s) => ({
      label: STATUS_LABELS[s.status]?.label ?? s.status,
      count: s.count,
      color: STATUS_LABELS[s.status]?.color ?? 'bg-gray-300',
    })),
    [report.statusBreakdown],
  )

  return (
    <div className={cn('p-4 lg:p-6 space-y-6 transition-opacity', loading && 'opacity-60')}>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">分析レポート</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'yyyy年M月', { locale: ja })} の実績</p>
        </div>
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="h-8 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="all">全院</option>
          {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: '今月の売上', value: `¥${kpi.thisMonthRev.toLocaleString()}`,
            sub: <ChangeBadge current={kpi.thisMonthRev} prev={kpi.lastMonthRev} />,
            icon: Receipt, iconBg: 'bg-green-100', iconColor: 'text-green-700',
          },
          {
            label: '今月の来院数', value: `${kpi.thisMonthVisits}名`,
            sub: <ChangeBadge current={kpi.thisMonthVisits} prev={kpi.lastMonthVisits} />,
            icon: CalendarCheck, iconBg: 'bg-blue-100', iconColor: 'text-blue-700',
          },
          {
            label: '今月の新患数', value: `${kpi.newPatients}名`,
            sub: <span className="text-xs text-muted-foreground">今月初診</span>,
            icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-700',
          },
          {
            label: 'リピート率', value: `${kpi.repeatRate}%`,
            sub: <span className="text-xs text-muted-foreground">2回以上来院</span>,
            icon: Repeat2, iconBg: 'bg-amber-100', iconColor: 'text-amber-700',
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{value}</p>
            <div className="mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">30日間売上推移</h2>
          <BarChart
            data={days30.map((d) => ({ label: d.label, value: d.revenue }))}
            color="bg-green-600"
            formatVal={(v) => `¥${v.toLocaleString()}`}
          />
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">30日間来院数推移</h2>
          <BarChart
            data={days30.map((d) => ({ label: d.label, value: d.visits }))}
            color="bg-blue-500"
            formatVal={(v) => `${v}名`}
          />
        </div>
      </div>

      {/* 下段テーブル */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* スタッフ別実績 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">スタッフ別実績（今月）</h2>
          {staffStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 text-xs text-muted-foreground font-medium">スタッフ</th>
                  <th className="text-right py-1.5 text-xs text-muted-foreground font-medium">来院数</th>
                  <th className="text-right py-1.5 text-xs text-muted-foreground font-medium">売上</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffStats.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </td>
                    <td className="py-2 text-right font-semibold">{s.visits}名</td>
                    <td className="py-2 text-right font-semibold text-green-800">
                      ¥{s.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* メニュー別売上 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">メニュー別売上（今月）</h2>
          {menuRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <div className="space-y-2">
              {menuRanking.map((m, i) => {
                const max = menuRanking[0].revenue
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="text-muted-foreground w-4 text-right">{i + 1}</span>
                        {m.name}
                      </span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-muted-foreground">{m.count}件</span>
                        <span className="font-semibold text-green-800 w-20 text-right">
                          ¥{m.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(m.revenue / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 予約ステータス内訳 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold text-green-900 mb-3">今月の予約内訳</h2>
        <StatusBar data={statusBreakdown} />
      </div>

      {/* 再診促進リスト */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-green-900">未再診患者リスト</h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {inactivePatients.length}名
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">最終来院から</span>
            <div className="flex gap-1">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setInactiveDays(d)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md border transition-colors font-medium',
                    inactiveDays === d
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-border text-muted-foreground hover:border-amber-400',
                  )}
                >
                  {d}日以上
                </button>
              ))}
            </div>
          </div>
        </div>

        {inactivePatients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {inactiveDays}日以上未来院の患者はいません
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">患者名</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">電話番号</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">最終来院</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">経過日数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inactivePatients.map((p) => (
                  <tr key={p.id} className="hover:bg-green-50/40">
                    <td className="py-2.5">
                      <div className="font-medium text-green-900">{p.name}</div>
                      {p.nameKana && <div className="text-xs text-muted-foreground">{p.nameKana}</div>}
                    </td>
                    <td className="py-2.5 text-muted-foreground hidden sm:table-cell">
                      {p.phone ? (
                        <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:text-green-700">
                          <PhoneCall className="w-3 h-3" />
                          {p.phone}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-sm">
                      {p.lastVisitDate
                        ? format(new Date(p.lastVisitDate), 'yyyy年M月d日', { locale: ja })
                        : <span className="text-amber-600 font-medium">来院歴なし</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      {p.daysSince !== null ? (
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          p.daysSince >= 180 ? 'bg-red-100 text-red-700' :
                          p.daysSince >= 90 ? 'bg-amber-100 text-amber-700' :
                          'bg-yellow-50 text-yellow-700',
                        )}>
                          {p.daysSince}日
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
