import { createSlice, PayloadAction } from '@reduxjs/toolkit'
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