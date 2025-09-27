import { apiClient } from './client'

export interface ProjectTeamMember {
  user: {
    _id: string
    name: string
    email: string
    role: string
  }
  role: 'lead' | 'developer' | 'tester' | 'designer'
  joinedAt: string
}

// NOTE: This reflects the current backend Mongoose schema (Project.js)
// Only fields defined in schema or provided via timestamps/virtuals are present.
// Virtuals: taskCount, completedTaskCount
export interface Project {
  _id: string
  id?: string // some endpoints may return both id and _id
  title: string
  description: string
  status: 'active' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdBy: {
    _id: string
    name: string
    email: string
    role: string
  }
  teamMembers: ProjectTeamMember[]
  startDate?: string // schema default Date.now
  completedDate?: string | null
  progress?: number // backend may send numeric progress (even if derived)
  tags?: string[]
  tasks?: ProjectTask[] // optional tasks list if included
  // Virtual counts
  taskCount?: number
  completedTaskCount?: number
  // Mongoose timestamps
  createdAt: string
  updatedAt: string
}

// Minimal placeholder; expand when task schema is available
export interface ProjectTask {
  _id: string
  id?: string
  title: string
  description?: string
  status: 'open' | 'in-progress' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: 'bug' | 'feature' | 'enhancement' | 'maintenance' | 'documentation'
  projectId: string
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dueDate?: string
  startDate?: string
  completedDate?: string | null
  isOverdue?: boolean
  daysRemaining?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProjectsPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
  pageSize?: number
}

export interface ProjectsListResponse {
  projects: Project[]
  pagination: ProjectsPagination
}

export interface FetchProjectsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
}

export interface CreateProjectPayload {
  title: string
  description: string
  priority?: Project['priority']
}

export interface UpdateProjectPayload {
  title?: string
  description?: string
  status?: Project['status']
  priority?: Project['priority']
}

export const projectsApi = {
  async list(params: FetchProjectsParams = {}): Promise<ProjectsListResponse> {
    const resp = await apiClient.get<ProjectsListResponse>('/projects', {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 12),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
    })
    // Defensive normalization
    return {
      ...resp,
      projects: Array.isArray(resp.projects) ? resp.projects : [],
      pagination: resp.pagination
    }
  },
  async get(id: string): Promise<Project> {
    // The controller returns formatSuccessResponse({ project, tasks })
    // Some apiClient implementations may already unwrap to data; handle all shapes safely.
  type ProjectGetShape = Project | { project: Project; tasks?: ProjectTask[] } | { data: { project: Project; tasks?: ProjectTask[] } }
  const raw = await apiClient.get<ProjectGetShape>(`/projects/${id}`)
    // Possible shapes:
    // 1. { project, tasks }
    // 2. { data: { project, tasks }, success, message }
    // 3. { success, data: { project }, ... }
    // 4. Direct project object
    const extract = (obj: ProjectGetShape): Project => {
      if (!obj || typeof obj !== 'object') return obj as Project
      // Shape 1
      if ('project' in obj) {
        const p = obj.project
        if (Array.isArray((obj as { tasks?: ProjectTask[] }).tasks)) {
          p.tasks = (obj as { tasks?: ProjectTask[] }).tasks
        }
        return p
      }
      // Shape 2 / 3
      if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const d = obj.data as { project: Project; tasks?: ProjectTask[] }
        if (d.project) {
          const p = d.project
          if (Array.isArray(d.tasks)) p.tasks = d.tasks
          return p
        }
      }
      // Shape 4: ensure tasks already present or undefined
      return obj as Project
    }
    return extract(raw)
  },
  async create(payload: CreateProjectPayload): Promise<Project> {
    return apiClient.post<Project>('/projects', payload)
  },
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    return apiClient.put<Project>(`/projects/${id}`, payload)
  },
  async remove(id: string): Promise<null> { // backend returns success with null data on delete
    return apiClient.delete<null>(`/projects/${id}`)
  },
  async addTeamMember(id: string, userId: string, role: ProjectTeamMember['role']): Promise<Project> {
    // Backend: PUT /projects/:id/team-members { userId, role }
    return apiClient.put<Project>(`/projects/${id}/team-members`, { userId, role })
  }
}

export default projectsApi
