import { createAsyncThunk } from '@reduxjs/toolkit'
import { projectsApi, ProjectFilters, CreateProjectData, UpdateProjectData } from '../../api/projects'
import { handleApiError } from '../../api/client'

// Fetch paginated list
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (filters: ProjectFilters | undefined, { rejectWithValue }) => {
    try {
      // Clean filters: remove undefined/null and convert non-string primitives
      const cleaned: Record<string, string> | undefined = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .reduce<Record<string, string>>((acc, [k, v]) => {
              acc[k] = typeof v === 'string' ? v : String(v)
              return acc
            }, {})
        : undefined
      const res = await projectsApi.getProjects(cleaned as any)
      return res
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await projectsApi.getProject(id)
      return res
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const createProjectThunk = createAsyncThunk(
  'projects/create',
  async (data: CreateProjectData, { rejectWithValue }) => {
    try {
      const res = await projectsApi.createProject(data)
      return res
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const updateProjectThunk = createAsyncThunk(
  'projects/update',
  async ({ id, data }: { id: string; data: UpdateProjectData }, { rejectWithValue }) => {
    try {
      const res = await projectsApi.updateProject(id, data)
      return res
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const deleteProjectThunk = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectsApi.deleteProject(id)
      return id
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)
