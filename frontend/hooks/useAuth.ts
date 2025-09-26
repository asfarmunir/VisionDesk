import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch, type RootState } from '../lib/store'
import { authApi } from '../lib/api'
import { 
  setLoading, 
  setError, 
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction, 
  updateProfile as updateProfileAction,
  clearError,
  type User 
} from '../lib/store/features/authSlice'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, accessToken, isAuthenticated, isLoading, error } = useAppSelector((state: RootState) => state.auth)
  const initialized = useRef(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized.current) return
      initialized.current = true

      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        dispatch(setLoading(false))
        return
      }

      try {
        dispatch(setLoading(true))
        const response = await authApi.validateToken()
        dispatch(loginSuccess({ 
          user: response.data, 
          accessToken: storedToken, 
          refreshToken: storedToken 
        }))
      } catch (error) {
        console.error('Token validation failed:', error)
        localStorage.removeItem('token')
        dispatch(loginFailure('Session expired. Please log in again.'))
      } finally {
        dispatch(setLoading(false))
      }
    }

    initializeAuth()
  }, [dispatch])

  const login = async (email: string, password: string) => {
    try {
      dispatch(loginStart())
      
      const response = await authApi.login({ email, password })
      localStorage.setItem('token', response.data.token)
      dispatch(loginSuccess({ 
        user: response.data.user, 
        accessToken: response.data.token, 
        refreshToken: response.data.token 
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      dispatch(loginFailure(errorMessage))
      return { success: false, error: errorMessage }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch(loginStart())
      
      const response = await authApi.register({ name, email, password })
      localStorage.setItem('token', response.data.token)
      dispatch(loginSuccess({ 
        user: response.data.user, 
        accessToken: response.data.token, 
        refreshToken: response.data.token 
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      dispatch(loginFailure(errorMessage))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      localStorage.removeItem('token')
      dispatch(logoutAction())
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      dispatch(setLoading(true))
      const response = await authApi.updateProfile(data)
      dispatch(updateProfileAction(response.data))
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      dispatch(setError(errorMessage))
      return { success: false, error: errorMessage }
    } finally {
      dispatch(setLoading(false))
    }
  }

  return {
    user,
    token: accessToken,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    clearError: () => dispatch(clearError()),
  }
}