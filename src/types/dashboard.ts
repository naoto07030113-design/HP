export type PeriodFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom'

export interface DateRange {
  from: string  // yyyy-MM-dd
  to: string    // yyyy-MM-dd
}

export interface KPISnapshot {
  sales: number
  visits: number
  newPatients: number
  repeatPatients: number
  repeatRate: number        // 0–100 %
  cancellationRate: number  // 0–100 %
  averageSpend: number
  inactivePatients: number  // 90+ days without visit
  totalReservations: number
  cancelledCount: number
  noShowCount: number
}

export interface ClinicKPI extends KPISnapshot {
  clinicId: string
  clinicName: string
}

export interface StaffKPI {
  staffId: string
  staffName: string
  role: string
  clinicId: string
  clinicName: string
  sales: number
  visits: number
  newPatients: number
  repeatRate: number
  cancellations: number
  averageSpend: number
}

export interface TrendPoint {
  date: string   // yyyy-MM-dd
  label: string  // display label e.g. "6/1"
  value: number
}

export type AlertSeverity = 'danger' | 'warning' | 'info'

export interface AlertItem {
  id: string
  severity: AlertSeverity
  category: string
  title: string
  message: string
}

export interface DashboardData {
  period: DateRange
  prevPeriod: DateRange
  overall: KPISnapshot
  prevOverall: KPISnapshot
  clinics: ClinicKPI[]
  staff: StaffKPI[]
  salesTrend: TrendPoint[]
  visitTrend: TrendPoint[]
  newPatientTrend: TrendPoint[]
  alerts: AlertItem[]
}
