// 給与・人事労務システム専用のログイン権限。
// クリニック予約システムの UserRole (admin/staff/receptionist) とは別軸の権限。
export type PayrollRole = 'chief_director' | 'clinic_director' | 'payroll_staff'

export const PAYROLL_ROLE_LABELS: Record<PayrollRole, string> = {
  chief_director: '総院長',
  clinic_director: '院長',
  payroll_staff: '給与担当',
}

export function parsePayrollRole(raw: unknown): PayrollRole | null {
  if (raw === 'chief_director' || raw === 'clinic_director' || raw === 'payroll_staff') return raw
  return null
}

// 総院長・給与担当・未設定（既存アカウント）はフルアクセス。
// 院長のみ「自院のデータに限定」の制限対象。
export function isClinicScoped(role: PayrollRole | null): boolean {
  return role === 'clinic_director'
}

export const PAYROLL_PERMISSIONS = {
  // 院長は自院の従業員閲覧・登録のみ。給与計算の実行や税理士出力等は不可。
  canManageEmployees:  (role: PayrollRole | null) => !isClinicScoped(role),
  canRunCalculation:   (role: PayrollRole | null) => !isClinicScoped(role),
  canSendSlips:        (role: PayrollRole | null) => !isClinicScoped(role),
  canUpdateSlipStatus: (role: PayrollRole | null) => !isClinicScoped(role),
  canAccessExport:     (role: PayrollRole | null) => !isClinicScoped(role),
  canAccessSubmissions:(role: PayrollRole | null) => !isClinicScoped(role),
  canAccessCompliance: (role: PayrollRole | null) => !isClinicScoped(role),
  canManageContracts:  (role: PayrollRole | null) => !isClinicScoped(role),
}
