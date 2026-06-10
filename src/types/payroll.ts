export type ContractType = '正社員' | 'パート' | '業務委託'
export type PayrollStatus = 'draft' | 'confirmed' | 'paid'
export type SubmissionStatus = 'pending' | 'parsed' | 'validated' | 'error' | 'processed'
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low'
export type ComplianceCategory = '最低賃金' | '社会保険' | '税制' | '労働法' | '育休' | 'その他'

export interface PayrollEmployee {
  id: string
  staff_id: string | null
  employee_number: string | null
  contract_type: ContractType
  hire_date: string
  resignation_date: string | null
  birth_date: string | null
  basic_salary: number
  hourly_wage: number
  fixed_overtime_hours: number
  fixed_overtime_amount: number
  health_insurance_enrolled: boolean
  pension_enrolled: boolean
  employment_insurance_enrolled: boolean
  dependent_count: number
  resident_tax_monthly: number
  commute_allowance_monthly: number
  commute_allowance_taxable: number
  bank_name: string | null
  bank_branch: string | null
  bank_account_type: '普通' | '当座'
  bank_account_number: string | null
  bank_account_holder: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  staff?: {
    id: string
    name: string
    clinic_id: string | null
    clinic?: { name: string }
  }
}

export interface PayrollAttendance {
  id: string
  payroll_employee_id: string
  year: number
  month: number
  scheduled_work_days: number
  actual_work_days: number
  paid_leave_days: number
  absence_days: number
  late_early_leave_times: number
  scheduled_work_hours: number
  actual_work_hours: number
  overtime_hours: number
  overtime_hours_over60: number
  late_night_hours: number
  holiday_work_hours: number
  notes: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface AllowanceItem {
  id?: string
  calculation_id?: string
  category: string
  description: string
  amount: number
  is_taxable: boolean
  is_deduction: boolean
  notes?: string
}

export interface PayrollCalculation {
  id: string
  payroll_employee_id: string
  year: number
  month: number
  payment_date: string | null
  basic_salary: number
  fixed_overtime_pay: number
  excess_overtime_pay: number
  late_night_pay: number
  holiday_work_pay: number
  absence_deduction: number
  commute_allowance: number
  commute_allowance_taxable: number
  performance_allowance: number
  other_allowances: number
  gross_pay: number
  taxable_gross: number
  health_insurance: number
  nursing_care_insurance: number
  welfare_pension: number
  employment_insurance: number
  income_tax: number
  resident_tax: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  standard_monthly_salary: number
  status: PayrollStatus
  insurance_rate_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  allowances?: AllowanceItem[]
  employee?: PayrollEmployee
}

export interface SubmissionItem {
  id: string
  submission_id: string
  line_number: number | null
  employee_name: string
  contract_type: string | null
  items: Array<{
    category: string
    description: string
    amount: number
  }>
  total_amount: number
  is_validated: boolean
  discrepancy_notes: string | null
  matched_employee_id: string | null
  payroll_calculation_id: string | null
  created_at: string
}

export interface PayrollSubmission {
  id: string
  year: number
  month: number
  department: string
  submitted_by: string | null
  submitted_date: string | null
  file_name: string | null
  file_url: string | null
  raw_text: string | null
  status: SubmissionStatus
  employee_count: number | null
  parsed_data: unknown
  discrepancies: unknown
  notes: string | null
  created_at: string
  updated_at: string
  items?: SubmissionItem[]
}

export interface SocialInsuranceRates {
  id: string
  effective_date: string
  prefecture: string
  association: string
  health_insurance_employee_rate: number
  health_insurance_employer_rate: number
  nursing_care_employee_rate: number
  nursing_care_employer_rate: number
  pension_employee_rate: number
  pension_employer_rate: number
  employment_insurance_employee_rate: number
  employment_insurance_employer_rate: number
  is_active: boolean
  notes: string | null
}

export interface MinimumWageRate {
  id: string
  effective_date: string
  prefecture: string
  hourly_wage: number
  notes: string | null
}

export interface PayrollCompliance {
  id: string
  category: ComplianceCategory
  law_name: string
  effective_date: string
  prefecture: string | null
  summary: string
  detail: string | null
  impact_level: ImpactLevel
  action_required: string | null
  is_applied: boolean
  applied_at: string | null
  applied_by: string | null
  source_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 給与計算入力
export interface PayrollCalculationInput {
  employee: PayrollEmployee
  attendance: PayrollAttendance
  rates: SocialInsuranceRates
  additionalAllowances?: AllowanceItem[]
  manualAdjustments?: {
    performance_allowance?: number
    other_allowances?: number
    other_deductions?: number
    resident_tax?: number
  }
}

// 給与計算結果（未保存）
export interface PayrollCalculationResult {
  basic_salary: number
  fixed_overtime_pay: number
  excess_overtime_pay: number
  late_night_pay: number
  holiday_work_pay: number
  absence_deduction: number
  commute_allowance: number
  commute_allowance_taxable: number
  performance_allowance: number
  other_allowances: number
  gross_pay: number
  taxable_gross: number
  standard_monthly_salary: number
  health_insurance: number
  nursing_care_insurance: number
  welfare_pension: number
  employment_insurance: number
  income_tax: number
  resident_tax: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  breakdown: {
    label: string
    amount: number
    type: 'income' | 'deduction'
  }[]
}

// 月次給与サマリー
export interface MonthlyPayrollSummary {
  year: number
  month: number
  total_employees: number
  total_gross: number
  total_net: number
  total_insurance: number
  total_income_tax: number
  by_status: {
    draft: number
    confirmed: number
    paid: number
  }
  by_department: {
    department: string
    count: number
    gross: number
  }[]
}

// PDF解析結果
export interface ParsedPdfData {
  year: number
  month: number
  department: string
  submitted_date: string | null
  employee_count: number
  employees: Array<{
    line_number: number
    name: string
    contract_type: string
    items: Array<{
      category: string
      description: string
      amount: number
    }>
    total_amount: number
  }>
  raw_notes: string[]
}
