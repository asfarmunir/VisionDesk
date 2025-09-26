import { apiClient, ApiResponse } from './client'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface DashboardMetrics {
  projects: {
    total: number
    active: number
    completed: number
    onHold: number
    cancelled: number
  }
  tasks: {
    total: number
    todo: number
    inProgress: number
    review: number
    completed: number
    cancelled: number
    overdue: number
  }
  tickets: {
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    overdue: number
  }
  users: {
    total: number
    active: number
    online: number
  }
}

export interface ProjectAnalytics {
  overview: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    overallProgress: number
  }
  statusDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  budgetAnalysis: {
    totalBudget: number
    usedBudget: number
    remainingBudget: number
  }
  timeline: Array<{
    date: string
    created: number
    completed: number
    cancelled: number
  }>
  teamProductivity: Array<{
    userId: string
    userName: string
    projectsCount: number
    tasksCompleted: number
    avgCompletionTime: number
  }>
}

export interface TaskAnalytics {
  overview: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    avgCompletionTime: number
  }
  statusDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  timeTracking: {
    totalEstimatedHours: number
    totalActualHours: number
    efficiency: number
  }
  timeline: Array<{
    date: string
    created: number
    completed: number
    overdue: number
  }>
  assigneePerformance: Array<{
    userId: string
    userName: string
    tasksAssigned: number
    tasksCompleted: number
    avgCompletionTime: number
    onTimeCompletion: number
  }>
}

export interface TicketAnalytics {
  overview: {
    totalTickets: number
    resolvedTickets: number
    avgResolutionTime: number
    customerSatisfaction: number
  }
  statusDistribution: Record<string, number>
  typeDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  severityDistribution: Record<string, number>
  timeline: Array<{
    date: string
    created: number
    resolved: number
    escalated: number
  }>
  agentPerformance: Array<{
    userId: string
    userName: string
    ticketsAssigned: number
    ticketsResolved: number
    avgResolutionTime: number
    satisfactionScore: number
  }>
  slaMetrics: {
    slaCompliance: number
    breachedTickets: number
    escalatedTickets: number
  }
}

export interface UserActivityAnalytics {
  loginActivity: Array<{
    date: string
    logins: number
    uniqueUsers: number
  }>
  userEngagement: Array<{
    userId: string
    userName: string
    lastActive: string
    sessionsCount: number
    avgSessionDuration: number
    actionsCount: number
  }>
  featureUsage: Record<string, number>
  geographicDistribution: Array<{
    country: string
    userCount: number
  }>
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number
    p95: number
    p99: number
  }
  throughput: {
    requestsPerSecond: number
    tasksPerHour: number
  }
  errors: {
    errorRate: number
    criticalErrors: number
  }
  uptime: {
    percentage: number
    downtimeMinutes: number
  }
}

export const analyticsApi = {
  // Dashboard overview
  getDashboardMetrics: (dateRange?: DateRange): Promise<ApiResponse<DashboardMetrics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/dashboard', params)
  },

  // Project analytics
  getProjectAnalytics: (dateRange?: DateRange): Promise<ApiResponse<ProjectAnalytics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/projects', params)
  },

  getProjectMetrics: (projectId: string, dateRange?: DateRange): Promise<ApiResponse<{
    progress: number
    tasksCompletion: number
    timeUtilization: number
    budgetUtilization: number
    teamPerformance: Array<{
      userId: string
      userName: string
      contribution: number
      tasksCompleted: number
    }>
  }>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get(`/analytics/projects/${projectId}`, params)
  },

  // Task analytics
  getTaskAnalytics: (dateRange?: DateRange): Promise<ApiResponse<TaskAnalytics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/tasks', params)
  },

  // Ticket analytics
  getTicketAnalytics: (dateRange?: DateRange): Promise<ApiResponse<TicketAnalytics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/tickets', params)
  },

  // User activity analytics
  getUserActivityAnalytics: (dateRange?: DateRange): Promise<ApiResponse<UserActivityAnalytics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/users', params)
  },

  // Performance metrics
  getPerformanceMetrics: (dateRange?: DateRange): Promise<ApiResponse<PerformanceMetrics>> => {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/performance', params)
  },

  // Custom reports
  generateReport: (config: {
    type: 'projects' | 'tasks' | 'tickets' | 'users'
    metrics: string[]
    filters?: Record<string, unknown>
    dateRange?: DateRange
    format?: 'json' | 'csv' | 'pdf'
  }): Promise<ApiResponse<unknown> | Blob> => {
    if (config.format && config.format !== 'json') {
      // Return blob for file downloads
      const params: Record<string, string> = {
        type: config.type,
        metrics: config.metrics.join(','),
        format: config.format,
      }
      if (config.dateRange) {
        params.startDate = config.dateRange.startDate
        params.endDate = config.dateRange.endDate
      }
      if (config.filters) {
        Object.entries(config.filters).forEach(([key, value]) => {
          params[`filter_${key}`] = String(value)
        })
      }
      return apiClient.get('/analytics/reports/generate', params)
    }
    
    // Return JSON response
    return apiClient.post('/analytics/reports/generate', config)
  },

  // Real-time metrics
  getRealTimeMetrics: (): Promise<ApiResponse<{
    activeUsers: number
    openTasks: number
    openTickets: number
    systemLoad: number
    responseTime: number
  }>> =>
    apiClient.get('/analytics/realtime'),

  // Trending data
  getTrendingData: (
    metric: 'projects' | 'tasks' | 'tickets' | 'users',
    period: 'day' | 'week' | 'month' | 'quarter',
    dateRange?: DateRange
  ): Promise<ApiResponse<Array<{
    date: string
    value: number
    change: number
    changePercent: number
  }>>> => {
    const params: Record<string, string> = { metric, period }
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    return apiClient.get('/analytics/trends', params)
  },

  // Forecasting
  getForecast: (
    metric: 'project_completion' | 'task_completion' | 'ticket_resolution',
    horizon: number = 30
  ): Promise<ApiResponse<{
    predictions: Array<{
      date: string
      predicted: number
      confidence: number
    }>
    accuracy: number
    model: string
  }>> =>
    apiClient.get('/analytics/forecast', { metric, horizon: String(horizon) }),

  // Comparative analytics
  getComparativeAnalytics: (
    compareBy: 'period' | 'team' | 'project',
    baseline: string,
    comparison: string
  ): Promise<ApiResponse<{
    baseline: Record<string, number>
    comparison: Record<string, number>
    differences: Record<string, number>
    percentageChanges: Record<string, number>
  }>> =>
    apiClient.get('/analytics/compare', { compareBy, baseline, comparison }),
}

export default analyticsApi