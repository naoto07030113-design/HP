/**
 * ダッシュボード表示のための小さな計算。
 *
 * KPI の集計そのものは `src/server/services/AnalyticsService.ts` にある。
 * 以前はここでブラウザ側が全予約・全会計・全患者を読み込んで集計しており、
 * 他院のデータが端末に載っていた。集計をサーバーへ移したため、
 * このファイルに残すのは「表示のための計算」だけにする。
 */

/** 前期比（%）。前期が0なら比較できないので null */
export function changeRate(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}
