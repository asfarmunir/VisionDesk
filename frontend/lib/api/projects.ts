import { apiClient, ApiResponse, PaginatedResponse } from './client'
import { Project } from '../store/features/projectSlice'

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
  getProjects: (filters?: ProjectFilters): Promise<PaginatedResponse<Project>> =>
    apiClient.get('/projects', filters as Record<string, string>),

  getProject: (id: string): Promise<ApiResponse<Project>> =>
    apiClient.get(`/projects/${id}`),

  createProject: (data: CreateProjectData): Promise<ApiResponse<Project>> =>
    apiClient.post('/projects', data),

  updateProject: (id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> =>
    apiClient.put(`/projects/${id}`, data),

  deleteProject: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/projects/${id}`),

  // Team management
  addTeamMember: (id: string, data: { userId: string; role: string }): Promise<ApiResponse<Project>> =>
    apiClient.post(`/projects/${id}/team`, data),

  updateTeamMember: (id: string, userId: string, data: { role: string }): Promise<ApiResponse<Project>> =>
    apiClient.put(`/projects/${id}/team/${userId}`, data),

  removeTeamMember: (id: string, userId: string): Promise<ApiResponse<Project>> =>
    apiClient.delete(`/projects/${id}/team/${userId}`),

  // Project analytics
  getProjectAnalytics: (id: string): Promise<ApiResponse<{
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
  }>> =>
    apiClient.get(`/projects/${id}/analytics`),

  // Bulk operations
  bulkUpdateProjects: (data: { ids: string[]; updates: Partial<Project> }): Promise<ApiResponse<Project[]>> =>
    apiClient.put('/projects/bulk', data),

  bulkDeleteProjects: (ids: string[]): Promise<ApiResponse> =>
    apiClient.post('/projects/bulk/delete', { ids }),

  // Project templates
  getProjectTemplates: (): Promise<ApiResponse<Array<{
    id: string
    name: string
    description: string
    structure: Partial<CreateProjectData>
  }>>> =>
    apiClient.get('/projects/templates'),

  createFromTemplate: (templateId: string, data: Partial<CreateProjectData>): Promise<ApiResponse<Project>> =>
    apiClient.post(`/projects/templates/${templateId}/create`, data),

  // Export/Import
  exportProject: (id: string, format: 'json' | 'csv' | 'pdf'): Promise<Blob> =>
    apiClient.get(`/projects/${id}/export?format=${format}`),

  duplicateProject: (id: string, data: { title: string; includeTasks?: boolean }): Promise<ApiResponse<Project>> =>
    apiClient.post(`/projects/${id}/duplicate`, data),
}

export default projectsApi