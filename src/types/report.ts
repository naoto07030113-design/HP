export interface ActionPlan {
  id: string
  category: string
  action: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'done'
}

export interface ReportSection {
  id: string
  title: string
  content: string
}

export interface MonthlyReport {
  id: string
  month: string      // "yyyy-MM"
  clinicId: string   // 'all' or specific clinic id
  clinicName: string
  title: string

  summary: string
  sections: ReportSection[]
  issues: string[]
  actionPlans: ActionPlan[]

  meetingNotes: string
  decisions: string[]

  kpiSnapshot: Record<string, number>

  createdAt: string
  updatedAt: string
}

export const ACTION_PRIORITY_LABELS: Record<ActionPlan['priority'], string> = {
  high: '最優先',
  medium: '通常',
  low: '余裕時',
}

export const ACTION_STATUS_LABELS: Record<ActionPlan['status'], string> = {
  pending: '未着手',
  in_progress: '対応中',
  done: '完了',
}

export const ACTION_STATUS_COLORS: Record<ActionPlan['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}
