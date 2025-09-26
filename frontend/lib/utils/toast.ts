import toast, { ToastOptions } from 'react-hot-toast'

// Lightweight helper to keep toast usage consistent
// Avoids repeating try/catch boilerplate in thunks & components
export const notify = {
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  error: (message: string, options?: ToastOptions) => toast.error(message, options),
  loading: (message: string, options?: ToastOptions) => toast.loading(message, options),
  dismiss: (id?: string) => (id ? toast.dismiss(id) : toast.dismiss()),
  promise: <T>(p: Promise<T>, msgs: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) }) => {
    return toast.promise(p, msgs)
  }
}

export default notify
