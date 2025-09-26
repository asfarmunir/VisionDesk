import { apiClient } from './client'
import { Task } from '../store/features/taskSlice'

export interface CreateTaskData {
  title: string
  description: string
  projectId: string
  assignedTo: string
  dueDate: string
  priority?: Task['priority']
  category?: string
  estimatedHours?: number
  tags?: string[]
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  actualHours?: number
  status?: Task['status']
}

export interface TaskFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  projectId?: string
  assignedTo?: string
  dueDate?: string
}

export interface TaskPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface TaskStats {
  totalTasks: number
  openTasks: number
  inProgressTasks: number
  resolvedTasks: number
  closedTasks: number
  overdueTasks: number
  avgEstimatedHours: number
  avgActualHours: number
}

export interface TaskComment { content: string }

export const tasksApi = {
  getTasks: (filters?: TaskFilters): Promise<{ tasks: Task[]; pagination: TaskPagination }> =>
    apiClient.get('/tasks', filters as Record<string, string>),
  getTask: (id: string): Promise<Task> => apiClient.get(`/tasks/${id}`),
  createTask: (data: CreateTaskData): Promise<Task> => apiClient.post('/tasks', data),
  updateTask: (id: string, data: UpdateTaskData): Promise<Task> => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id: string): Promise<{ success: boolean }> => apiClient.delete(`/tasks/${id}`),
  addComment: (id: string, content: string): Promise<Task> => apiClient.post(`/tasks/${id}/comments`, { content }),
  getStats: (): Promise<TaskStats> => apiClient.get('/tasks/stats')
}

export default tasksApi