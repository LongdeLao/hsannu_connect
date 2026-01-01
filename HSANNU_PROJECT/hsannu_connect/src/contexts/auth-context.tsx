'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { setCookie, getCookie, deleteCookie } from 'cookies-next'
import { API_URL } from '@/config'

export interface UserData {
  id: string | number
  name: string
  username?: string
  role: string
  additional_roles?: string[]
  profile_picture?: string
  email?: string
  status?: string
}

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Initialize auth state from localStorage and cookies
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const isLoggedIn = localStorage.getItem('loggedIn') === 'true'
        
        if (storedUser && isLoggedIn) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          
          // Set cookies for middleware
          setCookie('loggedIn', 'true', { maxAge: 60 * 60 * 24 * 7 }) // 7 days
          setCookie('userRole', userData.role, { maxAge: 60 * 60 * 24 * 7 })
        } else {
          setUser(null)
          deleteCookie('loggedIn')
          deleteCookie('userRole')
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('loggedIn')
        deleteCookie('loggedIn')
        deleteCookie('userRole')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`)
      }

      const userData: UserData = await response.json()
      
      // Save user data
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('loggedIn', 'true')
      
      // Set cookies for middleware
      setCookie('loggedIn', 'true', { maxAge: 60 * 60 * 24 * 7 }) // 7 days
      setCookie('userRole', userData.role, { maxAge: 60 * 60 * 24 * 7 })
      
      setUser(userData)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('loggedIn')
    deleteCookie('loggedIn')
    deleteCookie('userRole')
    setUser(null)
    router.push('/login')
  }

  const refreshUserData = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/profile/${user.id}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to refresh user data: ${response.status}`)
      }
      
      const updatedUserData = await response.json()
      setUser(updatedUserData)
      localStorage.setItem('user', JSON.stringify(updatedUserData))
    } catch (error) {
      console.error('Error refreshing user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 