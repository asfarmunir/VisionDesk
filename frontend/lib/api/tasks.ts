import { apiClient, ApiResponse, PaginatedResponse } from './client'
import { Task } from '../store/features/taskSlice'

export interface CreateTaskData {
  title: string
  description: string
  project: string
  assignedTo?: string
  status?: Task['status']
  priority?: Task['priority']
  tags?: string[]
  dueDate: string
  estimatedHours?: number
  dependencies?: string[]
  subtasks?: Array<{
    title: string
    completed?: boolean
  }>
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  actualHours?: number
  completedDate?: string
}

export interface TaskFilters {
  search?: string
  status?: string
  priority?: string
  assignedTo?: string
  assignedBy?: string
  project?: string
  tags?: string[]
  dueDateFrom?: string
  dueDateTo?: string
  overdue?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  groupBy?: string
}

export interface TaskComment {
  text: string
}

export const tasksApi = {
  // CRUD operations
  getTasks: (filters?: TaskFilters): Promise<PaginatedResponse<Task>> =>
    apiClient.get('/tasks', filters as Record<string, string>),

  getTask: (id: string): Promise<ApiResponse<Task>> =>
    apiClient.get(`/tasks/${id}`),

  createTask: (data: CreateTaskData): Promise<ApiResponse<Task>> =>
    apiClient.post('/tasks', data),

  updateTask: (id: string, data: UpdateTaskData): Promise<ApiResponse<Task>> =>
    apiClient.put(`/tasks/${id}`, data),

  deleteTask: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/tasks/${id}`),

  // Status management
  updateTaskStatus: (id: string, status: Task['status']): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}/status`, { status }),

  // Assignment management
  assignTask: (id: string, userId: string): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}/assign`, { assignedTo: userId }),

  unassignTask: (id: string): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}/unassign`),

  // Comments
  addComment: (id: string, comment: TaskComment): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${id}/comments`, comment),

  updateComment: (id: string, commentId: string, comment: TaskComment): Promise<ApiResponse<Task>> =>
    apiClient.put(`/tasks/${id}/comments/${commentId}`, comment),

  deleteComment: (id: string, commentId: string): Promise<ApiResponse<Task>> =>
    apiClient.delete(`/tasks/${id}/comments/${commentId}`),

  // Subtasks
  addSubtask: (id: string, subtask: { title: string }): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${id}/subtasks`, subtask),

  updateSubtask: (id: string, subtaskId: string, data: { title?: string; completed?: boolean }): Promise<ApiResponse<Task>> =>
    apiClient.put(`/tasks/${id}/subtasks/${subtaskId}`, data),

  deleteSubtask: (id: string, subtaskId: string): Promise<ApiResponse<Task>> =>
    apiClient.delete(`/tasks/${id}/subtasks/${subtaskId}`),

  // Attachments
  uploadAttachment: (id: string, file: File): Promise<ApiResponse<Task>> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload(`/tasks/${id}/attachments`, formData)
  },

  deleteAttachment: (id: string, attachmentId: string): Promise<ApiResponse<Task>> =>
    apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`),

  // Time tracking
  logTime: (id: string, data: { hours: number; description?: string; date?: string }): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${id}/time`, data),

  getTimeEntries: (id: string): Promise<ApiResponse<Array<{
    id: string
    hours: number
    description: string
    date: string
    loggedBy: string
    createdAt: string
  }>>> =>
    apiClient.get(`/tasks/${id}/time`),

  // Dependencies
  addDependency: (id: string, dependencyId: string): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${id}/dependencies`, { dependencyId }),

  removeDependency: (id: string, dependencyId: string): Promise<ApiResponse<Task>> =>
    apiClient.delete(`/tasks/${id}/dependencies/${dependencyId}`),

  // Bulk operations
  bulkUpdateTasks: (data: { ids: string[]; updates: Partial<Task> }): Promise<ApiResponse<Task[]>> =>
    apiClient.put('/tasks/bulk', data),

  bulkDeleteTasks: (ids: string[]): Promise<ApiResponse> =>
    apiClient.post('/tasks/bulk/delete', { ids }),

  bulkAssignTasks: (data: { ids: string[]; assignedTo: string }): Promise<ApiResponse<Task[]>> =>
    apiClient.post('/tasks/bulk/assign', data),

  // Analytics
  getTaskAnalytics: (filters?: Partial<TaskFilters>): Promise<ApiResponse<{
    statusDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
    overdueTasks: number
    avgCompletionTime: number
    totalEstimatedHours: number
    totalActualHours: number
    productivityMetrics: {
      tasksCompletedThisWeek: number
      tasksCompletedLastWeek: number
      avgTasksPerDay: number
    }
  }>> =>
    apiClient.get('/tasks/analytics', filters as Record<string, string>),

  // Task templates
  getTaskTemplates: (): Promise<ApiResponse<Array<{
    id: string
    name: string
    description: string
    template: Partial<CreateTaskData>
  }>>> =>
    apiClient.get('/tasks/templates'),

  createFromTemplate: (templateId: string, data: Partial<CreateTaskData>): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/templates/${templateId}/create`, data),

  // Export
  exportTasks: (filters?: TaskFilters, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> => {
    const params: Record<string, string> = { format }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
      })
    }
    return apiClient.get('/tasks/export', params)
  },

  // My tasks
  getMyTasks: (filters?: Omit<TaskFilters, 'assignedTo'>): Promise<PaginatedResponse<Task>> =>
    apiClient.get('/tasks/my-tasks', filters as Record<string, string>),

  // Project tasks
  getProjectTasks: (projectId: string, filters?: Omit<TaskFilters, 'project'>): Promise<PaginatedResponse<Task>> =>
    apiClient.get(`/projects/${projectId}/tasks`, filters as Record<string, string>),
}

export default tasksApi