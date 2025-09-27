import { apiClient } from './client'

export interface DashboardAnalytics {
  timeFrame: string
  projects: {
    stats: {
      totalProjects: number
      activeProjects: number
      completedProjects: number
      averageProgress: number
    }
    trend: Array<{ _id: { date: string; status: string }; count: number }>
  }
  tasks: {
    stats: {
      totalTasks: number
      openTasks: number
      inProgressTasks: number
      approvedTasks: number
      closedTasks: number
      overdueTasks: number
    }
    priorityDistribution: Record<string, number>
  }
  approvals: {
    stats: {
      totalClosedOrApproved: number
      closedPendingApproval: number
      fullyApproved: number
    }
  }
  userPerformance: Array<{
    _id: string
    totalTasks: number
    completedTasks: number
    completionRate: number
    averageActualHours?: number
    userName?: string
    userEmail?: string
  }> | null
  recentActivities: Array<{
    _id: string
    title: string
    status: string
    priority: string
    updatedAt: string
    assignedUser?: string
    projectTitle?: string
  }>
}

export interface CompletionTrendPoint {
  _id: string
  totalProjects: number
  completedProjects: number
  averageProgress: number
}

export interface TeamPerformanceEntry {
  _id: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  efficiency: number
  totalEstimatedHours?: number
  totalActualHours?: number
  user?: {
    _id: string
    name: string
    email: string
    role: string
  }
}

interface SuccessEnvelope<T=unknown> { success?: boolean; message?: string; data: T }
function isEnvelope(obj: unknown): obj is SuccessEnvelope {
  return !!obj && typeof obj === 'object' && 'data' in obj
}
function unwrap<T>(resp: unknown): T {
  if (isEnvelope(resp)) return resp.data as T
  return resp as T
}

export const analyticsApi = {
  async getDashboard(timeFrame?: string): Promise<DashboardAnalytics> {
    const resp = await apiClient.get(`/analytics/dashboard`, timeFrame ? { timeFrame } : {})
    return unwrap<DashboardAnalytics>(resp)
  },
  async getProjectCompletionTrend(days?: number): Promise<CompletionTrendPoint[]> {
    const resp = await apiClient.get(`/analytics/project-completion`, days ? { days: String(days) } : {})
    return unwrap<CompletionTrendPoint[]>(resp)
  },
  async getTeamPerformance(params: { projectId?: string; timeFrame?: string } = {}): Promise<TeamPerformanceEntry[]> {
    const resp = await apiClient.get(`/analytics/team-performance`, {
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.timeFrame ? { timeFrame: params.timeFrame } : {})
    })
    return unwrap<TeamPerformanceEntry[]>(resp)
  }
}

export default analyticsApi
