import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: number
}

export interface Modal {
  id: string
  type: 'confirmation' | 'form' | 'info' | 'custom'
  title: string
  content?: string
  data?: Record<string, unknown>
  onConfirm?: () => void
  onCancel?: () => void
}

export interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  sidebarMobile: boolean
  
  // Loading states
  globalLoading: boolean
  
  // Notifications
  notifications: Notification[]
  
  // Modals
  modals: Modal[]
  
  // Layout
  layout: {
    headerHeight: number
    sidebarWidth: number
    collapsedSidebarWidth: number
  }
  
  // Active views and selections
  activeView: 'dashboard' | 'projects' | 'tasks' | 'tickets' | 'analytics' | 'settings'
  selectedItems: {
    projects: string[]
    tasks: string[]
    tickets: string[]
  }
  
  // Search and command palette
  commandPaletteOpen: boolean
  globalSearchOpen: boolean
  globalSearchQuery: string
  
  // Preferences
  preferences: {
    animationsEnabled: boolean
    soundEnabled: boolean
    compactMode: boolean
    autoSave: boolean
    defaultProjectView: 'list' | 'grid' | 'kanban'
    defaultTaskView: 'list' | 'grid' | 'kanban'
    itemsPerPage: number
  }
}

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarMobile: false,
  globalLoading: false,
  notifications: [],
  modals: [],
  layout: {
    headerHeight: 64,
    sidebarWidth: 280,
    collapsedSidebarWidth: 80,
  },
  activeView: 'dashboard',
  selectedItems: {
    projects: [],
    tasks: [],
    tickets: [],
  },
  commandPaletteOpen: false,
  globalSearchOpen: false,
  globalSearchQuery: '',
  preferences: {
    animationsEnabled: true,
    soundEnabled: false,
    compactMode: false,
    autoSave: true,
    defaultProjectView: 'grid',
    defaultTaskView: 'kanban',
    itemsPerPage: 20,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme and appearance
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setSidebarMobile: (state, action: PayloadAction<boolean>) => {
      state.sidebarMobile = action.payload
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Modals
    openModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }
      state.modals.push(modal)
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload)
    },
    closeAllModals: (state) => {
      state.modals = []
    },
    
    // Active views and selections
    setActiveView: (state, action: PayloadAction<UIState['activeView']>) => {
      state.activeView = action.payload
    },
    setSelectedItems: (state, action: PayloadAction<{ type: keyof UIState['selectedItems']; items: string[] }>) => {
      state.selectedItems[action.payload.type] = action.payload.items
    },
    addSelectedItem: (state, action: PayloadAction<{ type: keyof UIState['selectedItems']; item: string }>) => {
      if (!state.selectedItems[action.payload.type].includes(action.payload.item)) {
        state.selectedItems[action.payload.type].push(action.payload.item)
      }
    },
    removeSelectedItem: (state, action: PayloadAction<{ type: keyof UIState['selectedItems']; item: string }>) => {
      state.selectedItems[action.payload.type] = state.selectedItems[action.payload.type].filter(
        item => item !== action.payload.item
      )
    },
    clearSelectedItems: (state, action: PayloadAction<keyof UIState['selectedItems']>) => {
      state.selectedItems[action.payload] = []
    },
    
    // Search and command palette
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload
    },
    setGlobalSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.globalSearchOpen = action.payload
    },
    setGlobalSearchQuery: (state, action: PayloadAction<string>) => {
      state.globalSearchQuery = action.payload
    },
    
    // Preferences
    setPreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    
    // Layout
    setLayoutDimensions: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload }
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarMobile,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setActiveView,
  setSelectedItems,
  addSelectedItem,
  removeSelectedItem,
  clearSelectedItems,
  setCommandPaletteOpen,
  setGlobalSearchOpen,
  setGlobalSearchQuery,
  setPreferences,
  setLayoutDimensions,
} = uiSlice.actions

export default uiSlice.reducer