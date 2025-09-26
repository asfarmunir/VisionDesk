import { useCallback } from 'react'
import { useAppDispatch } from '../lib/store'
import { 
  addNotification, 
  removeNotification, 
  clearNotifications,
  type Notification 
} from '../lib/store/features/uiSlice'

export const useNotifications = () => {
  const dispatch = useAppDispatch()

  const notify = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    dispatch(addNotification(notification))
  }, [dispatch])

  const success = useCallback((title: string, message: string, duration?: number) => {
    notify({ type: 'success', title, message, duration })
  }, [notify])

  const error = useCallback((title: string, message: string, duration?: number) => {
    notify({ type: 'error', title, message, duration })
  }, [notify])

  const warning = useCallback((title: string, message: string, duration?: number) => {
    notify({ type: 'warning', title, message, duration })
  }, [notify])

  const info = useCallback((title: string, message: string, duration?: number) => {
    notify({ type: 'info', title, message, duration })
  }, [notify])

  const dismiss = useCallback((id: string) => {
    dispatch(removeNotification(id))
  }, [dispatch])

  const clear = useCallback(() => {
    dispatch(clearNotifications())
  }, [dispatch])

  return {
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    clear,
  }
}