import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetchProjects, fetchProjectById, createProjectThunk, updateProjectThunk, deleteProjectThunk } from '../thunks/projectThunks'
import { Project, ProjectPagination } from '../../types/project'

// Shape of this slice of state
export interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  pagination: ProjectPagination
  filters: { search: string; status: string; priority: string }
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0, hasNextPage: false, hasPrevPage: false },
  filters: { search: '', status: '', priority: '' }
}

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload },
    setProjects: (state, action: PayloadAction<{ projects: Project[]; pagination: ProjectPagination }>) => {
      state.projects = action.payload.projects
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    addProject: (state, action: PayloadAction<Project>) => { state.projects.unshift(action.payload) },
    updateProject: (state, action: PayloadAction<Project>) => {
      const idx = state.projects.findIndex(p => p._id === action.payload._id)
      if (idx !== -1) state.projects[idx] = action.payload
      if (state.currentProject && state.currentProject._id === action.payload._id) state.currentProject = action.payload
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p._id !== action.payload)
      if (state.currentProject && state.currentProject._id === action.payload) state.currentProject = null
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => { state.currentProject = action.payload },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => { state.filters = { ...state.filters, ...action.payload } },
    clearFilters: (state) => { state.filters = initialState.filters },
    clearError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    // Fetch list
    builder.addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null })
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      const { items, pagination } = action.payload as { items: Project[]; pagination: ProjectPagination }
      state.projects = items || []
      state.pagination = pagination
      state.isLoading = false
    })
    builder.addCase(fetchProjects.rejected, (state, action) => { state.isLoading = false; state.error = (action.payload as string) || 'Failed to load projects' })

    // Fetch single
    builder.addCase(fetchProjectById.pending, (state) => { state.isLoading = true; state.error = null })
    builder.addCase(fetchProjectById.fulfilled, (state, action) => { state.currentProject = action.payload as Project; state.isLoading = false })
    builder.addCase(fetchProjectById.rejected, (state, action) => { state.isLoading = false; state.error = (action.payload as string) || 'Failed to load project' })

    // Create
    builder.addCase(createProjectThunk.fulfilled, (state, action) => { state.projects.unshift(action.payload as Project) })
    builder.addCase(createProjectThunk.rejected, (state, action) => { state.error = (action.payload as string) || 'Failed to create project' })

    // Update
    builder.addCase(updateProjectThunk.fulfilled, (state, action) => {
      const updated = action.payload as Project
      const idx = state.projects.findIndex(p => p._id === updated._id)
      if (idx !== -1) state.projects[idx] = updated
      if (state.currentProject && state.currentProject._id === updated._id) state.currentProject = updated
    })
    builder.addCase(updateProjectThunk.rejected, (state, action) => { state.error = (action.payload as string) || 'Failed to update project' })

    // Delete
    builder.addCase(deleteProjectThunk.fulfilled, (state, action) => {
      const id = action.payload as string
      state.projects = state.projects.filter(p => p._id !== id)
      if (state.currentProject && state.currentProject._id === id) state.currentProject = null
    })
    builder.addCase(deleteProjectThunk.rejected, (state, action) => { state.error = (action.payload as string) || 'Failed to delete project' })
  }
})

export const { setLoading, setError, setProjects, addProject, updateProject, deleteProject, setCurrentProject, setFilters, clearFilters, clearError } = projectSlice.actions
export default projectSlice.reducer