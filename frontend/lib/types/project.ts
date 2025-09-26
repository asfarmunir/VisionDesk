import { User } from '../store/features/authSlice'

export interface ProjectTeamMember {
  user: User
  role: 'lead' | 'developer' | 'tester' | 'designer'
  joinedAt: string
}

export interface Project {
  _id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'on-hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdBy: User
  teamMembers: ProjectTeamMember[]
  startDate: string
  dueDate: string
  completedDate?: string
  tags: string[]
  budget?: number
  progress: number
  taskCount?: number
  completedTaskCount?: number
  createdAt: string
  updatedAt: string
}

export interface ProjectPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}