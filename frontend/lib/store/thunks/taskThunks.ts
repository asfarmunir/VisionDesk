import { createAsyncThunk } from '@reduxjs/toolkit'
import { tasksApi, CreateTaskData, UpdateTaskData, TaskFilters } from '../../api/tasks'
import { handleApiError } from '../../api/client'

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (filters: TaskFilters | undefined, { rejectWithValue }) => {
    try {
      const cleaned: Record<string, string> | undefined = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .reduce<Record<string, string>>((acc, [k, v]) => {
              acc[k] = typeof v === 'string' ? v : String(v)
              return acc
            }, {})
        : undefined
  const res = await tasksApi.getTasks(cleaned as Record<string, string> | undefined)
      return res // { tasks, pagination }
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await tasksApi.getTask(id)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const createTaskThunk = createAsyncThunk(
  'tasks/create',
  async (data: CreateTaskData, { rejectWithValue }) => {
    try {
      return await tasksApi.createTask(data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const updateTaskThunk = createAsyncThunk(
  'tasks/update',
  async ({ id, data }: { id: string; data: UpdateTaskData }, { rejectWithValue }) => {
    try {
      return await tasksApi.updateTask(id, data)
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const deleteTaskThunk = createAsyncThunk(
  'tasks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await tasksApi.deleteTask(id)
      return id
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)

export const fetchTaskStats = createAsyncThunk(
  'tasks/stats',
  async (_, { rejectWithValue }) => {
    try {
      return await tasksApi.getStats()
    } catch (err) {
      return rejectWithValue(handleApiError(err))
    }
  }
)
