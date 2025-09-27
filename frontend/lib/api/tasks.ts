import { apiClient } from './client'

export interface Task {
  _id: string
  title: string
  description: string
  projectId: string
  assignedTo: {
    _id: string
    name: string
    email: string
    role: string
  } | string
  createdBy?: {
    _id: string
    name: string
    email: string
    role: string
  }
  status: 'open' | 'in-progress' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'bug' | 'feature' | 'enhancement' | 'maintenance' | 'documentation'
  dueDate: string
  startDate?: string
  completedDate?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskPayload {
  title: string
  description: string
  projectId: string
  assignedTo: string
  dueDate: string // ISO string
  priority?: Task['priority']
  category?: Task['category']
}

export const tasksApi = {
  async create(payload: CreateTaskPayload): Promise<Task> {
    // Backend route: POST /api/tasks
    return apiClient.post<Task>('/tasks', payload)
  }
}

export default tasksApi
