import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'

// User interface
export interface User {
  id: string
  email: string
  full_name?: string
  username?: string
  avatar_url?: string
}

// Auth context interface
interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API base URL
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1`

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(localStorage.getItem('refresh_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isAuthenticated = !!user && !!token

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      const storedRefreshToken = localStorage.getItem('refresh_token')
      if (storedToken) {
        try {
          setToken(storedToken)
          setRefreshTokenValue(storedRefreshToken)
          await getCurrentUser(storedToken)
          // Start auto-refresh timer
          startRefreshTimer()
        } catch (error) {
          console.error('Auth check failed:', error)
          // Try to refresh token if we have a refresh token
          if (storedRefreshToken) {
            try {
              await refreshToken()
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError)
              clearAuth()
            }
          } else {
            clearAuth()
          }
        }
      }
      setIsLoading(false)
    }

    checkAuth()
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  // Get current user from API
  const getCurrentUser = async (authToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get current user')
    }

    const userData = await response.json()
    // Ensure avatar_url is properly formatted
    if (userData.avatar_url && !userData.avatar_url.startsWith('http')) {
      userData.avatar_url = userData.avatar_url
    }
    setUser(userData)
  }

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          // If can't parse JSON, use status-based message
          if (response.status === 401) {
            errorMessage = 'Invalid credentials';
          } else if (response.status >= 500) {
            errorMessage = 'Internal Server Error';
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const accessToken = data.access_token
      const refreshTokenData = data.refresh_token

      // Store tokens
      localStorage.setItem('auth_token', accessToken)
      localStorage.setItem('refresh_token', refreshTokenData)
      setToken(accessToken)
      setRefreshTokenValue(refreshTokenData)

      // Get user data
      await getCurrentUser(accessToken)
      
      // Start auto-refresh timer
      startRefreshTimer()
    } catch (error) {
      console.error('Login error:', error)
      // Re-throw with original error for handling in component
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          ...(fullName && { full_name: fullName })
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Handle 422 validation errors specifically
        if (response.status === 422 && errorData.details?.validation_errors) {
          const fieldErrors = errorData.details.validation_errors
            .map((err: any) => err.message || err.msg)
            .join(', ')
          throw new Error(fieldErrors)
        }
        throw new Error(errorData.message || errorData.detail || 'Registration failed')
      }

      const data = await response.json()
      const accessToken = data.access_token
      const refreshTokenData = data.refresh_token

      // Store tokens
      localStorage.setItem('auth_token', accessToken)
      localStorage.setItem('refresh_token', refreshTokenData)
      setToken(accessToken)
      setRefreshTokenValue(refreshTokenData)

      // Get user data
      await getCurrentUser(accessToken)
      
      // Start auto-refresh timer
      startRefreshTimer()
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function with proper backend call
  const logout = async () => {
    try {
      // Call backend logout endpoint if we have a token
      if (token) {
        await fetch(`${API_BASE_URL}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local auth state
      clearAuth()
    }
  }

  // Refresh token function with proper backend call
  const refreshToken = async () => {
    const storedRefreshToken = refreshTokenValue || localStorage.getItem('refresh_token')
    if (!storedRefreshToken) {
      throw new Error('No refresh token available')
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const newAccessToken = data.access_token
      const newRefreshToken = data.refresh_token

      // Update tokens
      localStorage.setItem('auth_token', newAccessToken)
      localStorage.setItem('refresh_token', newRefreshToken)
      setToken(newAccessToken)
      setRefreshTokenValue(newRefreshToken)

      // Get updated user data
      await getCurrentUser(newAccessToken)
      
      return newAccessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuth()
      throw error
    }
  }
  
  // Helper function to clear auth state
  const clearAuth = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setRefreshTokenValue(null)
    setUser(null)
    
    // Clear refresh timer
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }
  
  // Start auto-refresh timer (every 15 minutes)
  const startRefreshTimer = () => {
    // Clear existing timer if any
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    
    // Set new timer for 15 minutes
    refreshIntervalRef.current = setInterval(async () => {
      try {
        await refreshToken()
        console.log('Token auto-refreshed successfully')
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 15 * 60 * 1000) // 15 minutes
  }

  const updateUser = (newUser: User) => {
    setUser(newUser)
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}