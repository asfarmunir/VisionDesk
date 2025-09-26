import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  fetchTasks,
  fetchTaskById,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  fetchTaskStats
} from '../thunks/taskThunks'
import { TaskStats } from '../../api/tasks'

// Lightweight backend task shape (API returns fewer fields than slice stores)
interface TaskFromApi {
  _id: string
  title: string
  description: string
  project?: { _id: string; title: string }
  projectId?: string
  assignedTo?: MinimalUser
  assignedBy?: MinimalUser
  status?: string
  priority?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  createdAt?: string
  updatedAt?: string
}

interface MinimalUser { _id: string; name?: string; email?: string }

const normalizeTask = (t: TaskFromApi): Task => ({
  _id: t._id,
  title: t.title,
  description: t.description,
  project: t.project ? { _id: t.project._id, title: t.project.title } : { _id: t.projectId || 'unknown', title: 'Unknown' },
  assignedTo: (t.assignedTo as unknown as User) || ({ _id: 'unknown', name: 'Unknown', email: '', role: 'user', isActive: true, lastLogin: '', createdAt: '', updatedAt: '' } as unknown as User),
  assignedBy: (t.assignedBy as unknown as User) || ({ _id: 'unknown', name: 'Unknown', email: '', role: 'user', isActive: true, lastLogin: '', createdAt: '', updatedAt: '' } as unknown as User),
  status: (t.status as Task['status']) || 'todo',
  priority: (t.priority as Task['priority']) || 'medium',
  tags: [],
  dueDate: t.dueDate || new Date().toISOString(),
  completedDate: undefined,
  estimatedHours: t.estimatedHours,
  actualHours: t.actualHours,
  dependencies: [],
  attachments: [],
  comments: [],
  subtasks: [],
  createdAt: t.createdAt || new Date().toISOString(),
  updatedAt: t.updatedAt || new Date().toISOString(),
})
import { User } from './authSlice'

export interface Task {
  _id: string
  title: string
  description: string
  project: {
    _id: string
    title: string
  }
  assignedTo: User
  assignedBy: User
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  dueDate: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  dependencies: string[]
  attachments: Array<{
    filename: string
    url: string
    uploadedAt: string
    uploadedBy: User
  }>
  comments: Array<{
    _id: string
    text: string
    author: User
    createdAt: string
    updatedAt: string
  }>
  subtasks: Array<{
    _id: string
    title: string
    completed: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface TasksState {
  tasks: Task[]
  currentTask: Task | null
  isLoading: boolean
  error: string | null
  stats: TaskStats | null
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
    assignedTo: string
    project: string
  }
  groupBy: 'status' | 'priority' | 'assignee' | 'project' | 'none'
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortOrder: 'asc' | 'desc'
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  stats: null,
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
    assignedTo: '',
    project: '',
  },
  groupBy: 'none',
  sortBy: 'dueDate',
  sortOrder: 'asc',
}

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setTasks: (state, action: PayloadAction<{ tasks: Task[]; pagination: TasksState['pagination'] }>) => {
      state.tasks = action.payload.tasks
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload)
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t._id === action.payload._id)
      if (index !== -1) {
        state.tasks[index] = action.payload
      }
      if (state.currentTask && state.currentTask._id === action.payload._id) {
        state.currentTask = action.payload
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t._id !== action.payload)
      if (state.currentTask && state.currentTask._id === action.payload) {
        state.currentTask = null
      }
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    setGroupBy: (state, action: PayloadAction<TasksState['groupBy']>) => {
      state.groupBy = action.payload
    },
    setSortBy: (state, action: PayloadAction<{ sortBy: TasksState['sortBy']; sortOrder: TasksState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },
    addComment: (state, action: PayloadAction<{ taskId: string; comment: Task['comments'][0] }>) => {
      const task = state.tasks.find(t => t._id === action.payload.taskId)
      if (task) {
        task.comments.push(action.payload.comment)
      }
      if (state.currentTask && state.currentTask._id === action.payload.taskId) {
        state.currentTask.comments.push(action.payload.comment)
      }
    },
    updateSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t._id === action.payload.taskId)
      if (task) {
        const subtask = task.subtasks.find(st => st._id === action.payload.subtaskId)
        if (subtask) {
          subtask.completed = action.payload.completed
        }
      }
      if (state.currentTask && state.currentTask._id === action.payload.taskId) {
        const subtask = state.currentTask.subtasks.find(st => st._id === action.payload.subtaskId)
        if (subtask) {
          subtask.completed = action.payload.completed
        }
      }
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Fetch list
    builder.addCase(fetchTasks.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.isLoading = false
      state.error = null
      const { tasks, pagination } = action.payload as { tasks: TaskFromApi[]; pagination: TasksState['pagination'] }
      state.tasks = tasks.map(normalizeTask)
      state.pagination = pagination
    })
    builder.addCase(fetchTasks.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string || 'Failed to fetch tasks'
    })

    // Fetch single
    builder.addCase(fetchTaskById.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchTaskById.fulfilled, (state, action) => {
      state.isLoading = false
      const t = action.payload as TaskFromApi
      state.currentTask = normalizeTask(t)
    })
    builder.addCase(fetchTaskById.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string || 'Failed to load task'
    })

    // Create
    builder.addCase(createTaskThunk.pending, (state) => {
      state.error = null
    })
    builder.addCase(createTaskThunk.fulfilled, (state, action) => {
      const t = action.payload as TaskFromApi
      state.tasks.unshift(normalizeTask(t))
      state.pagination.totalItems += 1
    })
    builder.addCase(createTaskThunk.rejected, (state, action) => {
      state.error = action.payload as string || 'Failed to create task'
    })

    // Update
    builder.addCase(updateTaskThunk.fulfilled, (state, action) => {
      const updated = action.payload as TaskFromApi
      const idx = state.tasks.findIndex(t => t._id === updated._id)
      const normalized = normalizeTask(updated)
      if (idx !== -1) state.tasks[idx] = normalized
      if (state.currentTask && state.currentTask._id === updated._id) {
        state.currentTask = normalized
      }
    })
    builder.addCase(updateTaskThunk.rejected, (state, action) => {
      state.error = action.payload as string || 'Failed to update task'
    })

    // Delete
    builder.addCase(deleteTaskThunk.fulfilled, (state, action) => {
      const id = action.payload as string
      state.tasks = state.tasks.filter(t => t._id !== id)
      state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1)
      if (state.currentTask && state.currentTask._id === id) state.currentTask = null
    })
    builder.addCase(deleteTaskThunk.rejected, (state, action) => {
      state.error = action.payload as string || 'Failed to delete task'
    })

    // Stats
    builder.addCase(fetchTaskStats.fulfilled, (state, action) => {
      state.stats = action.payload as TaskStats
    })
    builder.addCase(fetchTaskStats.rejected, (state, action) => {
      state.error = action.payload as string || 'Failed to load task stats'
    })
  }
})

export const {
  setLoading,
  setError,
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setCurrentTask,
  setFilters,
  clearFilters,
  setGroupBy,
  setSortBy,
  addComment,
  updateSubtask,
  clearError
} = taskSlice.actions

export default taskSlice.reducer