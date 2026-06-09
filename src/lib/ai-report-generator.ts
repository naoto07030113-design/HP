import { format, subMonths, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { MonthlyReport, ReportSection, ActionPlan } from '@/types/report'
import { computeKPIs, changeRate } from './dashboard-utils'
import { accountingStore } from './accounting-store'
import { patientStore } from './patient-store'
import type { DateRange } from '@/types/dashboard'

// ── ユーティリティ ──────────────────────────────────────────────────

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function pct(current: number, prev: number): string {
  const r = changeRate(current, prev)
  if (r === null) return '(前期データなし)'
  return `前期比 ${sign(r)}%`
}

function fmt(n: number, unit: string): string {
  if (unit === '¥') return `¥${n.toLocaleString()}`
  return `${n.toLocaleString()}${unit}`
}

// ── 月次 KPI 計算 ──────────────────────────────────────────────────

function getMonthRange(month: string): DateRange {
  const d = parseISO(`${month}-01`)
  return {
    from: format(startOfMonth(d), 'yyyy-MM-dd'),
    to: format(endOfMonth(d), 'yyyy-MM-dd'),
  }
}

// ── セクション生成 ──────────────────────────────────────────────────

function sec(id: string, title: string, content: string): ReportSection {
  return { id, title, content }
}

function buildSections(
  month: string,
  clinicId: string,
  clinicName: string,
  reservations: Parameters<typeof computeKPIs>[1],
  staffList: { id: string; name: string; role: string | null; clinic_id: string }[],
  clinicList: { id: string; name: string }[],
): ReportSection[] {
  const range = getMonthRange(month)
  const prevRange = getMonthRange(format(subMonths(parseISO(`${month}-01`), 1), 'yyyy-MM'))
  const prevYearRange = getMonthRange(format(subMonths(parseISO(`${month}-01`), 12), 'yyyy-MM'))

  const kpi = computeKPIs(range, reservations, clinicId)
  const prev = computeKPIs(prevRange, reservations, clinicId)
  const prevYear = computeKPIs(prevYearRange, reservations, clinicId)

  const monthLabel = format(parseISO(`${month}-01`), 'yyyy年M月', { locale: ja })
  const allInvoices = accountingStore.getAll()
  const prevMonthLabel = format(subMonths(parseISO(`${month}-01`), 1), 'M月', { locale: ja })

  // Payment breakdown
  const monthInvoices = allInvoices.filter((i) =>
    i.status === 'paid' && i.visit_date >= range.from && i.visit_date <= range.to &&
    (clinicId === 'all' || i.clinic_id === clinicId),
  )
  const cashAmount = monthInvoices.filter((i) => i.payment_method === 'cash').reduce((s, i) => s + i.total_amount, 0)
  const cardAmount = monthInvoices.filter((i) => i.payment_method === 'card').reduce((s, i) => s + i.total_amount, 0)
  const qrAmount = monthInvoices.filter((i) => ['paypay', 'line_pay'].includes(i.payment_method)).reduce((s, i) => s + i.total_amount, 0)

  // Top staff
  const staffKPIs = staffList
    .filter((s) => clinicId === 'all' || s.clinic_id === clinicId)
    .map((s) => {
      const sk = computeKPIs(range, reservations, s.clinic_id, s.id)
      return { ...s, ...sk }
    })
    .filter((s) => s.visits > 0)
    .sort((a, b) => b.sales - a.sales)

  const topStaff = staffKPIs[0]
  const referralBreakdown = patientStore.getAll()
    .filter((p) => (p.first_visit_date ?? '') >= range.from && (p.first_visit_date ?? '') <= range.to)
    .reduce((map, p) => {
      const src = p.referral_source ?? 'その他'
      map.set(src, (map.get(src) ?? 0) + 1)
      return map
    }, new Map<string, number>())

  const topReferral = Array.from(referralBreakdown.entries()).sort((a, b) => b[1] - a[1])[0]

  // Clinic breakdown (for 'all')
  const clinicKPIs = clinicList.map((c) => ({
    ...c,
    ...computeKPIs(range, reservations, c.id),
  })).sort((a, b) => b.sales - a.sales)

  // ── セクション本文 ──────────────────────────────────────────────

  const sections: ReportSection[] = []

  // 1. 総括
  sections.push(sec('summary', '1. 今月の総括', [
    `${monthLabel}の経営実績をまとめました。`,
    `売上合計は ${fmt(kpi.sales, '¥')}（${pct(kpi.sales, prev.sales)}）で、来院数は ${fmt(kpi.visits, '名')}（${pct(kpi.visits, prev.visits)}）でした。`,
    kpi.sales >= prev.sales
      ? `売上・来院数ともに前月を上回り、堅調な推移となっています。`
      : `売上・来院数が前月を下回っており、次月に向けた対策が求められます。`,
    `新患数 ${fmt(kpi.newPatients, '名')}、再診率 ${kpi.repeatRate}%、キャンセル率 ${kpi.cancellationRate}% という結果でした。`,
  ].join('')))

  // 2. 売上結果
  sections.push(sec('sales', '2. 売上結果', [
    `月次売上は ${fmt(kpi.sales, '¥')}（${pct(kpi.sales, prev.sales)}、前年同月比 ${pct(kpi.sales, prevYear.sales).replace('前期比 ', '')}）。`,
    `来院1回あたりの平均単価は ${fmt(kpi.averageSpend, '¥')} で、前月比 ${sign(kpi.averageSpend - prev.averageSpend)}円 の変動です。`,
    cashAmount > 0 ? `決済内訳：現金 ¥${cashAmount.toLocaleString()} / カード ¥${cardAmount.toLocaleString()} / QR ¥${qrAmount.toLocaleString()}。` : '',
    kpi.averageSpend < prev.averageSpend
      ? ' 平均単価の低下が見られます。高単価メニューへの誘導や施術時間の最適化を検討してください。'
      : ' 平均単価は前月を上回りました。引き続き高付加価値メニューの訴求を継続してください。',
  ].join('')))

  // 3. 院別実績
  if (clinicId === 'all' && clinicKPIs.length > 1) {
    const rows = clinicKPIs.map((c) =>
      `${c.name}：¥${c.sales.toLocaleString()}（来院 ${c.visits}名、新患 ${c.newPatients}名）`,
    ).join('。')
    sections.push(sec('clinic', '3. 院別実績', [
      `複数院の実績を比較します。`,
      rows + '。',
      clinicKPIs[0]
        ? `${clinicKPIs[0].name}が今月の最高売上でした。`
        : '',
      clinicKPIs.length > 1 && clinicKPIs[clinicKPIs.length - 1].visits < clinicKPIs[0].visits * 0.5
        ? ` ${clinicKPIs[clinicKPIs.length - 1].name}の稼働率が他院と比べて低い状況です。スタッフ配置やメニュー展開の見直しを推奨します。`
        : '',
    ].join('')))
  } else {
    sections.push(sec('clinic', '3. 院別実績', `${clinicName}のみ対象です。売上 ${fmt(kpi.sales, '¥')}、来院 ${fmt(kpi.visits, '名')}。`))
  }

  // 4. スタッフ別実績
  const staffRows = staffKPIs.slice(0, 5).map((s, i) =>
    `${i + 1}位: ${s.name}（${s.role}）— 売上 ¥${s.sales.toLocaleString()}、来院 ${s.visits}名`,
  ).join('。')
  sections.push(sec('staff', '4. スタッフ別実績', [
    staffRows || 'データなし。',
    staffKPIs.length > 0 ? ` 今月の最高売上スタッフは${topStaff?.name ?? ''}さん（¥${topStaff?.sales.toLocaleString() ?? 0}）です。` : '',
    staffKPIs.some((s) => s.visits === 0)
      ? ' 来院ゼロのスタッフがいます。シフト配置や担当患者の割り当てを確認してください。'
      : '',
  ].join('')))

  // 5. 新患・再診分析
  sections.push(sec('patients', '5. 新患・再診分析', [
    `新患数 ${fmt(kpi.newPatients, '名')}（${pct(kpi.newPatients, prev.newPatients)}）、再診率 ${kpi.repeatRate}%（前月 ${prev.repeatRate}%）。`,
    kpi.repeatRate < prev.repeatRate
      ? ` 再診率が${prev.repeatRate - kpi.repeatRate}ポイント低下しています。特に初回来院後7日以内の再予約率を確認し、問診・通院計画の説明を改善することを推奨します。`
      : ` 再診率は前月と同水準またはそれ以上を維持しています。`,
    topReferral
      ? ` 新患の主な集客経路は「${topReferral[0]}」（${topReferral[1]}名）です。`
      : '',
  ].join('')))

  // 6. キャンセル分析
  sections.push(sec('cancel', '6. キャンセル分析', [
    `キャンセル数 ${fmt(kpi.cancelledCount, '件')}、無断キャンセル ${fmt(kpi.noShowCount, '件')}、キャンセル率 ${kpi.cancellationRate}%。`,
    kpi.cancellationRate >= 20
      ? ` キャンセル率が ${kpi.cancellationRate}% と高水準です。前日リマインド送信の徹底と、キャンセルポリシーの見直しを検討してください。`
      : ` キャンセル率は許容範囲内です。引き続きリマインド通知を活用してください。`,
  ].join('')))

  // 7. 未再診患者分析
  sections.push(sec('inactive', '7. 未再診患者分析', [
    `90日以上来院していない患者が ${fmt(kpi.inactivePatients, '名')} います。`,
    kpi.inactivePatients >= 20
      ? ` 未再診患者が増加傾向にあります。来院促進メッセージの一斉送信や特別オファーの提案を検討してください。`
      : ` 未再診患者は管理可能な水準です。個別フォローを継続してください。`,
  ].join('')))

  // 8. CRM分析
  sections.push(sec('crm', '8. LINE・CRM分析', [
    `今月の新患 ${kpi.newPatients} 名のうち、LINE連携・WEB予約からの流入が主な経路です。`,
    `（LINE登録数・口コミ数はシステム連携後に自動集計されます。現状は手動入力が必要です。）`,
  ].join('')))

  // 9. Google口コミ分析
  sections.push(sec('review', '9. Google口コミ分析', `Google口コミのリアルタイム連携はAPI設定後に有効になります。現時点では手動でレポートに記載してください。高評価口コミの獲得に向けて、来院後サンクスメッセージで口コミ誘導を行うことを推奨します。`))

  // 10. 広告効果分析
  sections.push(sec('ads', '10. 広告効果分析', `広告費データは現システムに未登録です。広告費・CPA（顧客獲得単価）の追跡には「集客費用」フィールドの設定が必要です。新患の流入経路を定期的に問診で確認し、効果的な広告チャネルを特定してください。`))

  // 11. 良かった点
  const goods: string[] = []
  if (kpi.sales >= prev.sales) goods.push(`売上が前月比 ${sign(changeRate(kpi.sales, prev.sales) ?? 0)}% 増加`)
  if (kpi.repeatRate >= prev.repeatRate) goods.push(`再診率 ${kpi.repeatRate}% を維持・向上`)
  if (kpi.newPatients >= prev.newPatients) goods.push(`新患数が ${prev.newPatients} → ${kpi.newPatients} 名に増加`)
  if (kpi.cancellationRate <= 15) goods.push(`キャンセル率 ${kpi.cancellationRate}% と低水準を維持`)
  if (goods.length === 0) goods.push('今月は各指標の維持に努めた月でした。')
  sections.push(sec('goods', '11. 良かった点', goods.map((g, i) => `${i + 1}. ${g}`).join('\n')))

  // 12. 問題点
  const problems: string[] = []
  if (kpi.sales < prev.sales) problems.push(`売上が前月比 ${Math.abs(changeRate(kpi.sales, prev.sales) ?? 0)}% 減少`)
  if (kpi.repeatRate < prev.repeatRate - 3) problems.push(`再診率が ${prev.repeatRate}% → ${kpi.repeatRate}% に低下`)
  if (kpi.cancellationRate >= 20) problems.push(`キャンセル率 ${kpi.cancellationRate}% — 業界平均を上回る水準`)
  if (kpi.inactivePatients >= 20) problems.push(`未再診患者 ${kpi.inactivePatients} 名の放置`)
  if (kpi.newPatients < prev.newPatients) problems.push(`新患数が ${prev.newPatients} → ${kpi.newPatients} 名に減少`)
  if (problems.length === 0) problems.push('今月は目立った問題点はありませんでした。')
  sections.push(sec('problems', '12. 問題点', problems.map((p, i) => `${i + 1}. ${p}`).join('\n')))

  // 13. 原因分析
  const causes: string[] = []
  if (kpi.cancellationRate >= 20) causes.push('リマインド送信の未実施によるキャンセル増加の可能性')
  if (kpi.repeatRate < 50) causes.push('来院後の次回予約誘導（ネクスト・アポイント設定）が不十分な可能性')
  if (kpi.newPatients < prev.newPatients) causes.push('季節要因または広告予算・掲載内容の最適化不足')
  if (causes.length === 0) causes.push('今月は特段の問題要因は検出されませんでした。')
  sections.push(sec('cause', '13. 原因分析', causes.map((c, i) => `${i + 1}. ${c}`).join('\n')))

  // 14. 来月の重点施策
  const strategies: string[] = []
  if (kpi.repeatRate < prev.repeatRate) strategies.push('次回予約率の改善：来院時に次回予約を必ず案内する')
  if (kpi.inactivePatients >= 15) strategies.push(`未再診患者 ${kpi.inactivePatients} 名への再来院促進連絡`)
  if (kpi.cancellationRate >= 20) strategies.push('前日リマインド自動送信の設定・確認')
  if (kpi.newPatients < prev.newPatients) strategies.push('SNS・口コミ投稿キャンペーンの実施')
  if (strategies.length === 0) strategies.push('現状維持・さらなる質の向上を目指す')
  sections.push(sec('strategy', '14. 来月の重点施策', strategies.map((s, i) => `${i + 1}. ${s}`).join('\n')))

  // 15. 院長への指示
  sections.push(sec('director', '15. 院長への指示', [
    `1. スタッフミーティングで今月の数値を共有し、${problems[0] ?? '目標達成'}への対策を話し合う`,
    `2. ${kpi.repeatRate < 60 ? '初回来院後の「通院計画シート」を必ず患者に渡す' : '高再診率を維持するため患者満足度アンケートを継続する'}`,
    `3. 来月の売上目標：¥${Math.round(kpi.sales * 1.05).toLocaleString()}（前月比 +5%）を設定する`,
  ].join('\n')))

  // 16. スタッフへの共有事項
  sections.push(sec('staff_share', '16. スタッフへの共有事項', [
    `1. 今月の全体売上：¥${kpi.sales.toLocaleString()}（来院 ${kpi.visits}名）`,
    `2. ${kpi.repeatRate >= 60 ? '再診率が良好です。引き続き患者さんへの丁寧な説明をお願いします。' : '再診率向上のため、来院後に次回予約を必ず案内してください。'}`,
    `3. キャンセルが発生した場合は当日中にフォロー連絡を行ってください`,
  ].join('\n')))

  // 17. アクションリスト
  sections.push(sec('action_list', '17. 具体的アクションリスト', strategies.map((s, i) => `[ ] ${s}`).join('\n') || '[ ] 現状維持・モニタリング継続'))

  return sections
}

// ── アクションプラン生成 ──────────────────────────────────────────

function buildActionPlans(
  kpi: ReturnType<typeof computeKPIs>,
  prev: ReturnType<typeof computeKPIs>,
): ActionPlan[] {
  const plans: ActionPlan[] = []
  let seq = 1

  if (kpi.repeatRate < prev.repeatRate - 3) {
    plans.push({
      id: `ap-${seq++}`,
      category: '再診率向上',
      action: '来院時に次回予約を必ず案内する（ネクスト・アポイント設定）',
      owner: '全スタッフ',
      priority: 'high',
      status: 'pending',
    })
  }

  if (kpi.inactivePatients >= 15) {
    plans.push({
      id: `ap-${seq++}`,
      category: '未再診フォロー',
      action: `未再診患者 ${kpi.inactivePatients} 名にリマインドメッセージを送付する`,
      owner: '受付',
      priority: 'high',
      status: 'pending',
    })
  }

  if (kpi.cancellationRate >= 20) {
    plans.push({
      id: `ap-${seq++}`,
      category: 'キャンセル対策',
      action: '前日リマインド自動送信の設定を確認・有効化する',
      owner: '院長',
      priority: 'medium',
      status: 'pending',
    })
  }

  if (kpi.newPatients < prev.newPatients) {
    plans.push({
      id: `ap-${seq++}`,
      category: '新患獲得',
      action: 'Google口コミ誘導QRコードを来院時に配布する',
      owner: '受付',
      priority: 'medium',
      status: 'pending',
    })
  }

  plans.push({
    id: `ap-${seq++}`,
    category: 'データ管理',
    action: '翌月末に月次レポートを生成・経営会議で共有する',
    owner: '院長',
    priority: 'low',
    status: 'pending',
  })

  return plans
}

// ── メイン生成関数 ──────────────────────────────────────────────────

export function generateMonthlyReport(
  month: string,
  clinicId: string,
  clinicName: string,
  reservations: Parameters<typeof computeKPIs>[1],
  staffList: { id: string; name: string; role: string | null; clinic_id: string }[],
  clinicList: { id: string; name: string }[],
): Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'> {
  const range = getMonthRange(month)
  const prevRange = getMonthRange(format(subMonths(parseISO(`${month}-01`), 1), 'yyyy-MM'))

  const kpi = computeKPIs(range, reservations, clinicId)
  const prev = computeKPIs(prevRange, reservations, clinicId)

  const monthLabel = format(parseISO(`${month}-01`), 'yyyy年M月', { locale: ja })
  const sections = buildSections(month, clinicId, clinicName, reservations, staffList, clinicList)
  const actionPlans = buildActionPlans(kpi, prev)

  const issues: string[] = []
  if (kpi.repeatRate < prev.repeatRate - 3) issues.push(`再診率低下（${prev.repeatRate}% → ${kpi.repeatRate}%）`)
  if (kpi.cancellationRate >= 20) issues.push(`キャンセル率高止まり（${kpi.cancellationRate}%）`)
  if (kpi.inactivePatients >= 20) issues.push(`未再診患者増加（${kpi.inactivePatients}名）`)
  if (kpi.sales < prev.sales * 0.9) issues.push(`売上前月比 ${sign(changeRate(kpi.sales, prev.sales) ?? 0)}%`)

  const kpiSnapshot: Record<string, number> = {
    sales: kpi.sales,
    visits: kpi.visits,
    newPatients: kpi.newPatients,
    repeatRate: kpi.repeatRate,
    cancellationRate: kpi.cancellationRate,
    averageSpend: kpi.averageSpend,
    inactivePatients: kpi.inactivePatients,
    cancelledCount: kpi.cancelledCount,
    prevSales: prev.sales,
    prevVisits: prev.visits,
  }

  return {
    month,
    clinicId,
    clinicName,
    title: `${monthLabel} 月次経営レポート${clinicId !== 'all' ? ` — ${clinicName}` : ''}`,
    summary: sections[0]?.content ?? '',
    sections,
    issues,
    actionPlans,
    meetingNotes: '',
    decisions: [],
    kpiSnapshot,
  }
}
