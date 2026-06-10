/**
 * 日本の給与計算エンジン
 * 労働基準法・社会保険法に準拠した計算ロジック
 */

import type {
  PayrollEmployee,
  PayrollAttendance,
  SocialInsuranceRates,
  PayrollCalculationInput,
  PayrollCalculationResult,
  AllowanceItem,
} from '@/types/payroll'

// ============================================================
// 標準報酬月額等級表（2024年度）
// ============================================================
const KENPO_GRADES = [
  { grade: 1,  min: 0,      max: 63000,  monthly: 58000  },
  { grade: 2,  min: 63000,  max: 73000,  monthly: 68000  },
  { grade: 3,  min: 73000,  max: 83000,  monthly: 78000  },
  { grade: 4,  min: 83000,  max: 93000,  monthly: 88000  },
  { grade: 5,  min: 93000,  max: 101000, monthly: 98000  },
  { grade: 6,  min: 101000, max: 107000, monthly: 104000 },
  { grade: 7,  min: 107000, max: 114000, monthly: 110000 },
  { grade: 8,  min: 114000, max: 122000, monthly: 118000 },
  { grade: 9,  min: 122000, max: 130000, monthly: 126000 },
  { grade: 10, min: 130000, max: 138000, monthly: 134000 },
  { grade: 11, min: 138000, max: 146000, monthly: 142000 },
  { grade: 12, min: 146000, max: 155000, monthly: 150000 },
  { grade: 13, min: 155000, max: 165000, monthly: 160000 },
  { grade: 14, min: 165000, max: 175000, monthly: 170000 },
  { grade: 15, min: 175000, max: 185000, monthly: 180000 },
  { grade: 16, min: 185000, max: 195000, monthly: 190000 },
  { grade: 17, min: 195000, max: 210000, monthly: 200000 },
  { grade: 18, min: 210000, max: 230000, monthly: 220000 },
  { grade: 19, min: 230000, max: 250000, monthly: 240000 },
  { grade: 20, min: 250000, max: 270000, monthly: 260000 },
  { grade: 21, min: 270000, max: 290000, monthly: 280000 },
  { grade: 22, min: 290000, max: 310000, monthly: 300000 },
  { grade: 23, min: 310000, max: 330000, monthly: 320000 },
  { grade: 24, min: 330000, max: 350000, monthly: 340000 },
  { grade: 25, min: 350000, max: 370000, monthly: 360000 },
  { grade: 26, min: 370000, max: 395000, monthly: 380000 },
  { grade: 27, min: 395000, max: 425000, monthly: 410000 },
  { grade: 28, min: 425000, max: 455000, monthly: 440000 },
  { grade: 29, min: 455000, max: 485000, monthly: 470000 },
  { grade: 30, min: 485000, max: 515000, monthly: 500000 },
  { grade: 31, min: 515000, max: 545000, monthly: 530000 },
  { grade: 32, min: 545000, max: 575000, monthly: 560000 },
  { grade: 33, min: 575000, max: 605000, monthly: 590000 },
  { grade: 34, min: 605000, max: 635000, monthly: 620000 },
  { grade: 35, min: 635000, max: 665000, monthly: 650000 },
  { grade: 36, min: 665000, max: 695000, monthly: 680000 },
  { grade: 37, min: 695000, max: 730000, monthly: 710000 },
  { grade: 38, min: 730000, max: 770000, monthly: 750000 },
  { grade: 39, min: 770000, max: 810000, monthly: 790000 },
  { grade: 40, min: 810000, max: 855000, monthly: 830000 },
  { grade: 41, min: 855000, max: 905000, monthly: 880000 },
  { grade: 42, min: 905000, max: 955000, monthly: 930000 },
  { grade: 43, min: 955000, max: 1005000, monthly: 980000 },
  { grade: 44, min: 1005000, max: 1055000, monthly: 1030000 },
  { grade: 45, min: 1055000, max: 1115000, monthly: 1090000 },
  { grade: 46, min: 1115000, max: 1175000, monthly: 1150000 },
  { grade: 47, min: 1175000, max: 1235000, monthly: 1210000 },
  { grade: 48, min: 1235000, max: 1295000, monthly: 1270000 },
  { grade: 49, min: 1295000, max: 1355000, monthly: 1330000 },
  { grade: 50, min: 1355000, max: Infinity, monthly: 1390000 },
]

// 厚生年金の標準報酬月額（上限63万円）
const KOSEI_NENKIN_GRADES = KENPO_GRADES.filter(g => g.monthly <= 650000)

/** 標準報酬月額を算出 */
function getStandardMonthlySalary(grossPay: number, isPension = false): number {
  const grades = isPension ? KOSEI_NENKIN_GRADES : KENPO_GRADES
  const grade = grades.find(g => grossPay >= g.min && grossPay < g.max)
  return grade ? grade.monthly : grades[grades.length - 1].monthly
}

// ============================================================
// 源泉徴収税額表（月次・甲欄 2024年版 簡易版）
// 課税支給額ごとの税額（扶養0〜7+人）
// ============================================================
interface TaxBracket {
  minIncome: number
  maxIncome: number
  taxes: number[]  // dependents 0〜7
}

const MONTHLY_TAX_TABLE: TaxBracket[] = [
  { minIncome: 0,      maxIncome: 87000,   taxes: [0, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 87000,  maxIncome: 89000,   taxes: [130, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 89000,  maxIncome: 91000,   taxes: [180, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 91000,  maxIncome: 93000,   taxes: [230, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 93000,  maxIncome: 95000,   taxes: [290, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 95000,  maxIncome: 97000,   taxes: [340, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 97000,  maxIncome: 99000,   taxes: [390, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 99000,  maxIncome: 101000,  taxes: [440, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 101000, maxIncome: 103000,  taxes: [490, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 103000, maxIncome: 105000,  taxes: [540, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 105000, maxIncome: 107000,  taxes: [590, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 107000, maxIncome: 109000,  taxes: [640, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 109000, maxIncome: 111000,  taxes: [690, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 111000, maxIncome: 113000,  taxes: [740, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 113000, maxIncome: 115000,  taxes: [790, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 115000, maxIncome: 117000,  taxes: [840, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 117000, maxIncome: 119000,  taxes: [890, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 119000, maxIncome: 121000,  taxes: [940, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 121000, maxIncome: 123000,  taxes: [990, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 123000, maxIncome: 125000,  taxes: [1040, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 125000, maxIncome: 127000,  taxes: [1090, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 127000, maxIncome: 129000,  taxes: [1140, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 129000, maxIncome: 131000,  taxes: [1190, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 131000, maxIncome: 133000,  taxes: [1240, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 133000, maxIncome: 135000,  taxes: [1300, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 135000, maxIncome: 137000,  taxes: [1350, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 137000, maxIncome: 139000,  taxes: [1400, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 139000, maxIncome: 141000,  taxes: [1450, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 141000, maxIncome: 143000,  taxes: [1500, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 143000, maxIncome: 145000,  taxes: [1550, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 145000, maxIncome: 147000,  taxes: [1600, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 147000, maxIncome: 149000,  taxes: [1650, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 149000, maxIncome: 151000,  taxes: [1700, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 151000, maxIncome: 153000,  taxes: [1750, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 153000, maxIncome: 155000,  taxes: [1800, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 155000, maxIncome: 157000,  taxes: [1900, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 157000, maxIncome: 159000,  taxes: [1950, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 159000, maxIncome: 161000,  taxes: [2010, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 161000, maxIncome: 163000,  taxes: [2060, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 163000, maxIncome: 165000,  taxes: [2110, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 165000, maxIncome: 167000,  taxes: [2160, 0, 0, 0, 0, 0, 0, 0] },
  { minIncome: 167000, maxIncome: 169000,  taxes: [2210, 120, 0, 0, 0, 0, 0, 0] },
  { minIncome: 169000, maxIncome: 171000,  taxes: [2260, 170, 0, 0, 0, 0, 0, 0] },
  { minIncome: 171000, maxIncome: 173000,  taxes: [2320, 230, 0, 0, 0, 0, 0, 0] },
  { minIncome: 173000, maxIncome: 175000,  taxes: [2370, 280, 0, 0, 0, 0, 0, 0] },
  { minIncome: 175000, maxIncome: 177000,  taxes: [2420, 330, 0, 0, 0, 0, 0, 0] },
  { minIncome: 177000, maxIncome: 179000,  taxes: [2470, 380, 0, 0, 0, 0, 0, 0] },
  { minIncome: 179000, maxIncome: 181000,  taxes: [2520, 430, 0, 0, 0, 0, 0, 0] },
  { minIncome: 181000, maxIncome: 183000,  taxes: [2570, 480, 0, 0, 0, 0, 0, 0] },
  { minIncome: 183000, maxIncome: 185000,  taxes: [2620, 530, 0, 0, 0, 0, 0, 0] },
  { minIncome: 185000, maxIncome: 187000,  taxes: [2680, 590, 0, 0, 0, 0, 0, 0] },
  { minIncome: 187000, maxIncome: 189000,  taxes: [2730, 640, 0, 0, 0, 0, 0, 0] },
  { minIncome: 189000, maxIncome: 191000,  taxes: [2780, 690, 0, 0, 0, 0, 0, 0] },
  { minIncome: 191000, maxIncome: 193000,  taxes: [2830, 740, 0, 0, 0, 0, 0, 0] },
  { minIncome: 193000, maxIncome: 195000,  taxes: [2880, 790, 0, 0, 0, 0, 0, 0] },
  { minIncome: 195000, maxIncome: 197000,  taxes: [2930, 840, 0, 0, 0, 0, 0, 0] },
  { minIncome: 197000, maxIncome: 199000,  taxes: [2980, 900, 0, 0, 0, 0, 0, 0] },
  { minIncome: 199000, maxIncome: 201000,  taxes: [3090, 960, 0, 0, 0, 0, 0, 0] },
  { minIncome: 201000, maxIncome: 203000,  taxes: [3200, 1010, 0, 0, 0, 0, 0, 0] },
  { minIncome: 203000, maxIncome: 205000,  taxes: [3310, 1060, 0, 0, 0, 0, 0, 0] },
  { minIncome: 205000, maxIncome: 207000,  taxes: [3420, 1110, 0, 0, 0, 0, 0, 0] },
  { minIncome: 207000, maxIncome: 209000,  taxes: [3530, 1160, 0, 0, 0, 0, 0, 0] },
  { minIncome: 209000, maxIncome: 211000,  taxes: [3640, 1220, 0, 0, 0, 0, 0, 0] },
  { minIncome: 211000, maxIncome: 213000,  taxes: [3750, 1330, 0, 0, 0, 0, 0, 0] },
  { minIncome: 213000, maxIncome: 215000,  taxes: [3850, 1430, 0, 0, 0, 0, 0, 0] },
  { minIncome: 215000, maxIncome: 217000,  taxes: [3960, 1540, 0, 0, 0, 0, 0, 0] },
  { minIncome: 217000, maxIncome: 219000,  taxes: [4070, 1650, 0, 0, 0, 0, 0, 0] },
  { minIncome: 219000, maxIncome: 221000,  taxes: [4180, 1760, 0, 0, 0, 0, 0, 0] },
  { minIncome: 221000, maxIncome: 224000,  taxes: [4290, 1870, 0, 0, 0, 0, 0, 0] },
  { minIncome: 224000, maxIncome: 227000,  taxes: [4460, 2040, 0, 0, 0, 0, 0, 0] },
  { minIncome: 227000, maxIncome: 230000,  taxes: [4630, 2210, 0, 0, 0, 0, 0, 0] },
  { minIncome: 230000, maxIncome: 233000,  taxes: [4800, 2380, 400, 0, 0, 0, 0, 0] },
  { minIncome: 233000, maxIncome: 236000,  taxes: [4960, 2550, 560, 0, 0, 0, 0, 0] },
  { minIncome: 236000, maxIncome: 239000,  taxes: [5130, 2720, 730, 0, 0, 0, 0, 0] },
  { minIncome: 239000, maxIncome: 242000,  taxes: [5300, 2900, 900, 0, 0, 0, 0, 0] },
  { minIncome: 242000, maxIncome: 245000,  taxes: [5480, 3070, 1070, 0, 0, 0, 0, 0] },
  { minIncome: 245000, maxIncome: 248000,  taxes: [5650, 3240, 1240, 0, 0, 0, 0, 0] },
  { minIncome: 248000, maxIncome: 251000,  taxes: [5820, 3410, 1420, 0, 0, 0, 0, 0] },
  { minIncome: 251000, maxIncome: 254000,  taxes: [5990, 3590, 1590, 0, 0, 0, 0, 0] },
  { minIncome: 254000, maxIncome: 257000,  taxes: [6160, 3760, 1760, 0, 0, 0, 0, 0] },
  { minIncome: 257000, maxIncome: 260000,  taxes: [6340, 3930, 1930, 0, 0, 0, 0, 0] },
  { minIncome: 260000, maxIncome: 263000,  taxes: [6510, 4100, 2110, 0, 0, 0, 0, 0] },
  { minIncome: 263000, maxIncome: 266000,  taxes: [6680, 4270, 2280, 0, 0, 0, 0, 0] },
  { minIncome: 266000, maxIncome: 269000,  taxes: [6850, 4450, 2450, 0, 0, 0, 0, 0] },
  { minIncome: 269000, maxIncome: 272000,  taxes: [7020, 4620, 2620, 0, 0, 0, 0, 0] },
  { minIncome: 272000, maxIncome: 275000,  taxes: [7200, 4790, 2790, 0, 0, 0, 0, 0] },
  { minIncome: 275000, maxIncome: 278000,  taxes: [7370, 4960, 2970, 0, 0, 0, 0, 0] },
  { minIncome: 278000, maxIncome: 281000,  taxes: [7540, 5140, 3140, 0, 0, 0, 0, 0] },
  { minIncome: 281000, maxIncome: 284000,  taxes: [7710, 5310, 3310, 0, 0, 0, 0, 0] },
  { minIncome: 284000, maxIncome: 287000,  taxes: [7880, 5480, 3480, 0, 0, 0, 0, 0] },
  { minIncome: 287000, maxIncome: 290000,  taxes: [8060, 5650, 3650, 1660, 0, 0, 0, 0] },
  { minIncome: 290000, maxIncome: 293000,  taxes: [8280, 5870, 3820, 1830, 0, 0, 0, 0] },
  { minIncome: 293000, maxIncome: 296000,  taxes: [8500, 6090, 4040, 2050, 0, 0, 0, 0] },
  { minIncome: 296000, maxIncome: 299000,  taxes: [8720, 6310, 4260, 2270, 0, 0, 0, 0] },
  { minIncome: 299000, maxIncome: 302000,  taxes: [8940, 6530, 4480, 2490, 0, 0, 0, 0] },
  { minIncome: 302000, maxIncome: 305000,  taxes: [9160, 6750, 4700, 2710, 0, 0, 0, 0] },
  { minIncome: 305000, maxIncome: 308000,  taxes: [9380, 6970, 4920, 2930, 0, 0, 0, 0] },
  { minIncome: 308000, maxIncome: 311000,  taxes: [9600, 7190, 5140, 3150, 1160, 0, 0, 0] },
  { minIncome: 311000, maxIncome: 314000,  taxes: [9820, 7410, 5360, 3370, 1380, 0, 0, 0] },
  { minIncome: 314000, maxIncome: 317000,  taxes: [10040, 7630, 5580, 3590, 1600, 0, 0, 0] },
  { minIncome: 317000, maxIncome: 320000,  taxes: [10260, 7850, 5800, 3810, 1820, 0, 0, 0] },
  { minIncome: 320000, maxIncome: 323000,  taxes: [10480, 8070, 6020, 4030, 2040, 0, 0, 0] },
  { minIncome: 323000, maxIncome: 326000,  taxes: [10700, 8290, 6240, 4250, 2260, 0, 0, 0] },
  { minIncome: 326000, maxIncome: 329000,  taxes: [10920, 8510, 6460, 4470, 2480, 0, 0, 0] },
  { minIncome: 329000, maxIncome: 332000,  taxes: [11140, 8730, 6680, 4690, 2700, 0, 0, 0] },
  { minIncome: 332000, maxIncome: 335000,  taxes: [11360, 8950, 6900, 4910, 2920, 0, 0, 0] },
]

/** 月次源泉徴収税額を算出（甲欄） */
export function calcIncomeTax(taxableGross: number, dependents: number): number {
  const depIdx = Math.min(dependents, 7)

  // 高額所得（表外）
  if (taxableGross >= 335000) {
    // 簡易計算: 課税所得の年換算後に税率適用
    const annual = taxableGross * 12
    let annualTax = 0
    if      (annual <= 1950000)  annualTax = annual * 0.05
    else if (annual <= 3300000)  annualTax = annual * 0.10 - 97500
    else if (annual <= 6950000)  annualTax = annual * 0.20 - 427500
    else if (annual <= 9000000)  annualTax = annual * 0.23 - 636000
    else if (annual <= 18000000) annualTax = annual * 0.33 - 1536000
    else if (annual <= 40000000) annualTax = annual * 0.40 - 2796000
    else                         annualTax = annual * 0.45 - 4796000

    // 扶養控除（1人38万/年）
    const exemption = dependents * 380000 * 0.05  // 簡易的な控除影響
    return Math.max(0, Math.floor((annualTax - exemption) / 12 / 100) * 100)
  }

  const bracket = MONTHLY_TAX_TABLE.find(
    b => taxableGross >= b.minIncome && taxableGross < b.maxIncome
  )
  if (!bracket) return 0
  return bracket.taxes[depIdx] ?? 0
}

/** 欠勤控除額を計算（日割り） */
function calcAbsenceDeduction(
  employee: PayrollEmployee,
  attendance: PayrollAttendance
): number {
  if (attendance.absence_days <= 0) return 0

  if (employee.contract_type === '正社員') {
    // 欠勤控除 = 基本給 / 所定労働日数 × 欠勤日数
    const scheduledDays = attendance.scheduled_work_days || 21
    const dailyRate = Math.round(employee.basic_salary / scheduledDays)
    return dailyRate * attendance.absence_days
  }
  // パートは実績払いなので欠勤控除なし（別途算出）
  return 0
}

/** 時間外残業割増賃金を計算 */
function calcOvertimePay(
  employee: PayrollEmployee,
  attendance: PayrollAttendance
): { fixedOT: number; excessOT: number } {
  if (employee.contract_type === 'パート') {
    // パートは時給 × 残業時間 × 割増率
    const rate125 = Math.round(employee.hourly_wage * 1.25)
    const rate150 = Math.round(employee.hourly_wage * 1.50)  // 60H超
    return {
      fixedOT: 0,
      excessOT:
        Math.round(rate125 * attendance.overtime_hours) +
        Math.round(rate150 * attendance.overtime_hours_over60),
    }
  }

  // 正社員: 固定残業制
  const hourlyBasic = Math.round(
    (employee.basic_salary / 21 / 8)  // 月21日・1日8時間換算
  )
  const rate125 = Math.round(hourlyBasic * 1.25)
  const rate150 = Math.round(hourlyBasic * 1.50)

  // 固定残業時間を超えた分だけ追加支給
  const actualOT = attendance.overtime_hours
  const fixedOTHours = employee.fixed_overtime_hours
  const excessHours = Math.max(0, actualOT - fixedOTHours)
  const excessHoursOver60 = attendance.overtime_hours_over60

  return {
    fixedOT: employee.fixed_overtime_amount,
    excessOT:
      Math.round(rate125 * excessHours) +
      Math.round(rate150 * excessHoursOver60),
  }
}

/** 深夜・休日割増賃金 */
function calcPremiumPay(
  employee: PayrollEmployee,
  attendance: PayrollAttendance
): { lateNight: number; holiday: number } {
  const baseHourly =
    employee.contract_type === 'パート'
      ? employee.hourly_wage
      : Math.round(employee.basic_salary / 21 / 8)

  return {
    lateNight: Math.round(baseHourly * 0.25 * attendance.late_night_hours),
    holiday: Math.round(baseHourly * 0.35 * attendance.holiday_work_hours),
  }
}

/** 標準報酬月額を使った社会保険料を計算 */
function calcSocialInsurance(
  employee: PayrollEmployee,
  standardSalary: number,
  rates: SocialInsuranceRates
): {
  health: number
  nursing: number
  pension: number
  employment: number
  grossForInsurance: number
} {
  const standardHealth = getStandardMonthlySalary(standardSalary, false)
  const standardPension = getStandardMonthlySalary(standardSalary, true)

  let health = 0
  let nursing = 0
  let pension = 0

  if (employee.health_insurance_enrolled) {
    health = Math.floor(standardHealth * rates.health_insurance_employee_rate / 100)

    // 介護保険: 40歳以上65歳未満
    const age = employee.birth_date
      ? getAge(employee.birth_date)
      : 0
    if (age >= 40 && age < 65) {
      nursing = Math.floor(standardHealth * rates.nursing_care_employee_rate / 100)
    }
  }

  if (employee.pension_enrolled) {
    pension = Math.floor(standardPension * rates.pension_employee_rate / 100)
  }

  let employment = 0
  if (employee.employment_insurance_enrolled && employee.contract_type !== '業務委託') {
    // 雇用保険は実際の総支給額（通勤手当含む）に料率
    employment = Math.floor(standardSalary * rates.employment_insurance_employee_rate / 100)
  }

  return {
    health,
    nursing,
    pension,
    employment,
    grossForInsurance: standardSalary,
  }
}

function getAge(birthDateStr: string): number {
  const birth = new Date(birthDateStr)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ============================================================
// メイン計算関数
// ============================================================
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { employee, attendance, rates, additionalAllowances = [], manualAdjustments = {} } = input

  // --- 支給項目 ---
  const basicSalary =
    employee.contract_type === 'パート'
      ? Math.round(employee.hourly_wage * attendance.actual_work_hours)
      : employee.basic_salary

  const absenceDeduction = calcAbsenceDeduction(employee, attendance)
  const { fixedOT, excessOT } = calcOvertimePay(employee, attendance)
  const { lateNight, holiday } = calcPremiumPay(employee, attendance)

  const commuteNontaxable = employee.commute_allowance_monthly
  const commuteTaxable = employee.commute_allowance_taxable

  const performanceAllowance = manualAdjustments.performance_allowance ?? 0

  // 追加手当の合計（taxable分）
  const additionalTaxable = additionalAllowances
    .filter(a => a.is_taxable && !a.is_deduction)
    .reduce((sum, a) => sum + a.amount, 0)
  const additionalNontaxable = additionalAllowances
    .filter(a => !a.is_taxable && !a.is_deduction)
    .reduce((sum, a) => sum + a.amount, 0)
  const additionalDeduction = additionalAllowances
    .filter(a => a.is_deduction)
    .reduce((sum, a) => sum + a.amount, 0)

  const otherAllowances =
    (manualAdjustments.other_allowances ?? 0) + additionalTaxable + additionalNontaxable

  const grossPay =
    basicSalary +
    fixedOT +
    excessOT +
    lateNight +
    holiday -
    absenceDeduction +
    commuteNontaxable +
    commuteTaxable +
    performanceAllowance +
    otherAllowances

  // 課税支給額（社会保険料算定用: 非課税通勤手当を除く）
  const taxableGross =
    basicSalary +
    fixedOT +
    excessOT +
    lateNight +
    holiday -
    absenceDeduction +
    commuteTaxable +
    performanceAllowance +
    additionalTaxable

  // 標準報酬月額（社会保険料算定）
  const standardMonthlySalary = getStandardMonthlySalary(taxableGross + commuteNontaxable)

  // --- 控除項目 ---
  const { health, nursing, pension, employment } = calcSocialInsurance(
    employee,
    standardMonthlySalary,
    rates
  )

  // 所得税: 課税支給額 - 社会保険料合計
  const socialInsuranceTotal = health + nursing + pension + employment
  const taxableIncome = Math.max(0, taxableGross - socialInsuranceTotal)
  const incomeTax = calcIncomeTax(taxableIncome, employee.dependent_count)

  const residentTax = manualAdjustments.resident_tax ?? employee.resident_tax_monthly
  const otherDeductions =
    (manualAdjustments.other_deductions ?? 0) + additionalDeduction

  const totalDeductions =
    health + nursing + pension + employment + incomeTax + residentTax + otherDeductions

  const netPay = grossPay - totalDeductions

  // --- 明細ブレークダウン ---
  const breakdown: PayrollCalculationResult['breakdown'] = [
    { label: '基本給', amount: basicSalary, type: 'income' },
  ]

  if (employee.contract_type === '正社員' && fixedOT > 0) {
    breakdown.push({ label: `固定残業代（${employee.fixed_overtime_hours}H）`, amount: fixedOT, type: 'income' })
  }
  if (excessOT > 0) {
    breakdown.push({ label: '超過残業手当', amount: excessOT, type: 'income' })
  }
  if (lateNight > 0) {
    breakdown.push({ label: '深夜手当', amount: lateNight, type: 'income' })
  }
  if (holiday > 0) {
    breakdown.push({ label: '休日手当', amount: holiday, type: 'income' })
  }
  if (absenceDeduction > 0) {
    breakdown.push({ label: '欠勤控除', amount: -absenceDeduction, type: 'income' })
  }
  if (commuteNontaxable > 0) {
    breakdown.push({ label: '通勤手当（非課税）', amount: commuteNontaxable, type: 'income' })
  }
  if (commuteTaxable > 0) {
    breakdown.push({ label: '通勤手当（課税）', amount: commuteTaxable, type: 'income' })
  }
  if (performanceAllowance > 0) {
    breakdown.push({ label: '業績手当', amount: performanceAllowance, type: 'income' })
  }
  additionalAllowances.filter(a => !a.is_deduction).forEach(a => {
    breakdown.push({ label: a.description, amount: a.amount, type: 'income' })
  })

  // 控除
  if (health > 0) {
    breakdown.push({ label: '健康保険料', amount: health, type: 'deduction' })
  }
  if (nursing > 0) {
    breakdown.push({ label: '介護保険料', amount: nursing, type: 'deduction' })
  }
  if (pension > 0) {
    breakdown.push({ label: '厚生年金保険料', amount: pension, type: 'deduction' })
  }
  if (employment > 0) {
    breakdown.push({ label: '雇用保険料', amount: employment, type: 'deduction' })
  }
  if (incomeTax > 0) {
    breakdown.push({ label: '所得税（源泉徴収）', amount: incomeTax, type: 'deduction' })
  }
  if (residentTax > 0) {
    breakdown.push({ label: '住民税', amount: residentTax, type: 'deduction' })
  }
  additionalAllowances.filter(a => a.is_deduction).forEach(a => {
    breakdown.push({ label: a.description, amount: a.amount, type: 'deduction' })
  })
  if (otherDeductions > 0 && !additionalAllowances.some(a => a.is_deduction)) {
    breakdown.push({ label: 'その他控除', amount: otherDeductions, type: 'deduction' })
  }

  return {
    basic_salary: basicSalary,
    fixed_overtime_pay: fixedOT,
    excess_overtime_pay: excessOT,
    late_night_pay: lateNight,
    holiday_work_pay: holiday,
    absence_deduction: absenceDeduction,
    commute_allowance: commuteNontaxable,
    commute_allowance_taxable: commuteTaxable,
    performance_allowance: performanceAllowance,
    other_allowances: otherAllowances,
    gross_pay: grossPay,
    taxable_gross: taxableGross,
    standard_monthly_salary: standardMonthlySalary,
    health_insurance: health,
    nursing_care_insurance: nursing,
    welfare_pension: pension,
    employment_insurance: employment,
    income_tax: incomeTax,
    resident_tax: residentTax,
    other_deductions: otherDeductions,
    total_deductions: totalDeductions,
    net_pay: netPay,
    breakdown,
  }
}

/** 最低賃金チェック */
export function checkMinimumWage(
  hourlyWage: number,
  prefectureMinWage: number
): { ok: boolean; diff: number } {
  const diff = hourlyWage - prefectureMinWage
  return { ok: diff >= 0, diff }
}

/** 月60時間超残業チェック */
export function checkMonthlyOvertimeLimit(overtimeHours: number): {
  exceeded: boolean
  overHours: number
} {
  const overHours = Math.max(0, overtimeHours - 60)
  return { exceeded: overHours > 0, overHours }
}

/** 円フォーマット */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** 数値フォーマット（カンマ区切り） */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ja-JP').format(n)
}
