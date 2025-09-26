import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from './authSlice'

export interface Project {
  _id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'on-hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdBy: User
  teamMembers: Array<{
    user: User
    role: 'lead' | 'developer' | 'tester' | 'designer'
    joinedAt: string
  }>
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

export interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    search: string
    status: string
    priority: string
  }
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    status: '',
    priority: '',
  },
}

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setProjects: (state, action: PayloadAction<{ projects: Project[]; pagination: ProjectsState['pagination'] }>) => {
      state.projects = action.payload.projects
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload)
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p._id === action.payload._id)
      if (index !== -1) {
        state.projects[index] = action.payload
      }
      if (state.currentProject && state.currentProject._id === action.payload._id) {
        state.currentProject = action.payload
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p._id !== action.payload)
      if (state.currentProject && state.currentProject._id === action.payload) {
        state.currentProject = null
      }
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    }
  },
})

export const {
  setLoading,
  setError,
  setProjects,
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  setFilters,
  clearFilters,
  clearError
} = projectSlice.actions

export default projectSlice.reducer