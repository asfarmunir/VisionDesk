import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authSlice from './features/authSlice'
import projectSlice from './features/projectSlice'
import taskSlice from './features/taskSlice'
import ticketSlice from './features/ticketSlice'
import uiSlice from './features/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectSlice,
    tasks: taskSlice,
    tickets: ticketSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector