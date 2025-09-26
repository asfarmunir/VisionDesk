import { apiClient } from './client'
import { Project } from '../types/project'

export interface CreateProjectData {
  title: string
  description: string
  status?: Project['status']
  priority?: Project['priority']
  startDate: string
  dueDate: string
  tags?: string[]
  budget?: number
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  teamMembers?: Array<{
    user: string
    role: 'lead' | 'developer' | 'tester' | 'designer'
  }>
}

export interface ProjectFilters {
  search?: string
  status?: string
  priority?: string
  createdBy?: string
  teamMember?: string
  tags?: string[]
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const projectsApi = {
  // CRUD operations
  getProjects: (filters?: ProjectFilters): Promise<{ items: Project[]; pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }}> =>
    apiClient.get('/projects', filters as Record<string, string>),

  getProject: (id: string): Promise<Project> =>
    apiClient.get(`/projects/${id}`),

  createProject: (data: CreateProjectData): Promise<Project> =>
    apiClient.post('/projects', data),

  updateProject: (id: string, data: UpdateProjectData): Promise<Project> =>
    apiClient.put(`/projects/${id}`, data),

  deleteProject: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/projects/${id}`),

  // Team management
  addTeamMember: (id: string, data: { userId: string; role: string }): Promise<Project> =>
    apiClient.post(`/projects/${id}/team`, data),

  updateTeamMember: (id: string, userId: string, data: { role: string }): Promise<Project> =>
    apiClient.put(`/projects/${id}/team/${userId}`, data),

  removeTeamMember: (id: string, userId: string): Promise<Project> =>
    apiClient.delete(`/projects/${id}/team/${userId}`),

  // Project analytics
  getProjectAnalytics: (id: string): Promise<{
    taskStats: {
      total: number
      completed: number
      inProgress: number
      todo: number
    }
    timeStats: {
      estimatedHours: number
      actualHours: number
      remainingHours: number
    }
    teamStats: {
      totalMembers: number
      activeMembers: number
    }
    progress: number
  }> =>
    apiClient.get(`/projects/${id}/analytics`),

  // Bulk operations
  bulkUpdateProjects: (data: { ids: string[]; updates: Partial<Project> }): Promise<Project[]> =>
    apiClient.put('/projects/bulk', data),

  bulkDeleteProjects: (ids: string[]): Promise<{ success: boolean }> =>
    apiClient.post('/projects/bulk/delete', { ids }),

  // Project templates
  getProjectTemplates: (): Promise<Array<{
    id: string
    name: string
    description: string
    structure: Partial<CreateProjectData>
  }>> =>
    apiClient.get('/projects/templates'),

  createFromTemplate: (templateId: string, data: Partial<CreateProjectData>): Promise<Project> =>
    apiClient.post(`/projects/templates/${templateId}/create`, data),

  // Export/Import
  exportProject: (id: string, format: 'json' | 'csv' | 'pdf'): Promise<Blob> =>
    apiClient.get(`/projects/${id}/export?format=${format}`),

  duplicateProject: (id: string, data: { title: string; includeTasks?: boolean }): Promise<Project> =>
    apiClient.post(`/projects/${id}/duplicate`, data),
}

export default projectsApi