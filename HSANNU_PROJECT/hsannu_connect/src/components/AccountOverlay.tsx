'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { API_URL } from '@/config'
import { Button } from './ui/button'
import { X, Edit2, Check } from 'lucide-react'
import { Skeleton } from './ui/skeleton'

interface UserProfile {
  id: number
  username: string
  name: string
  role: string
  email: string
  status: string
  profile_picture: string
  additional_roles: string[]
}

// EmailEditor component for inline email editing
interface EmailEditorProps {
  email: string
  userId: number
  onEmailUpdate: (newEmail: string) => void
}



function EmailEditor({ email, userId, onEmailUpdate }: EmailEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(email === 'not-registered' ? '' : email)
  const [isLoading, setIsLoading] = useState(false)
  
  const isEmailNotRegistered = email === 'not-registered'

  const handleSave = async () => {
    if (!isEmailNotRegistered && editValue === email) {
      setIsEditing(false)
      return
    }
    
    if (editValue.trim() === '') {
      alert('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const token = getCookie('token')
      const response = await fetch(`${API_URL}/api/profile/update-email/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: editValue })
      })

      if (response.ok) {
        onEmailUpdate(editValue)
        setIsEditing(false)
      } else {
        // Reset to original value on error
        setEditValue(isEmailNotRegistered ? '' : email)
        alert('Failed to update email')
      }
    } catch (error) {
      console.error('Error updating email:', error)
      setEditValue(isEmailNotRegistered ? '' : email)
      alert('Failed to update email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(isEmailNotRegistered ? '' : email)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 h-8">
        <input
          type="email"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={isEmailNotRegistered ? "Enter your email address" : ""}
          className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-base focus:outline-none h-8"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || editValue.trim() === ''}
          className="px-2 py-1 h-8"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-2 py-1 h-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group h-8">
      <div className={`text-base flex-1 ${isEmailNotRegistered ? 'text-gray-400 italic' : 'text-gray-900'} flex items-center`}>
        {isEmailNotRegistered ? 'Click to add email address' : email}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 h-8"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  )
}



export default function AccountOverlay() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        console.log('🔍 Starting profile load...')
        
        // Try cookie first (cookies-next getCookie returns string | undefined)
        const cookieUserId = getCookie('userId')
        const userIdFromCookie: string | undefined = cookieUserId ? String(cookieUserId) : undefined
        console.log('🍪 Cookie userId:', userIdFromCookie)
        
        // Try localStorage (same as sidebar)
        const stored = localStorage.getItem('user')
        console.log('📦 LocalStorage user:', stored)
        
        let currentUserId: string | number | null = userIdFromCookie ?? null
        if (!currentUserId && stored) {
          const parsed = JSON.parse(stored)
          currentUserId = parsed?.id ?? null
          console.log('📋 Parsed userId from localStorage:', currentUserId)
        }
        
        if (!currentUserId) {
          console.error('❌ No user ID found in cookie or localStorage')
          return
        }

        setUserId(currentUserId)

        console.log('🆔 Using userId:', currentUserId)
        console.log('🌐 API URL:', API_URL)
        
        const profileUrl = `${API_URL}/api/profile/${currentUserId}`
        console.log('📡 Fetching from:', profileUrl)

        const resp = await fetch(profileUrl, { cache: 'no-store' })
        console.log('📊 Response status:', resp.status)
        console.log('📊 Response ok:', resp.ok)
        
        if (!resp.ok) {
          const errorText = await resp.text()
          console.error('❌ API Error:', errorText)
          return
        }
        
        const data = await resp.json()
        console.log('✅ Profile data received:', data)
        setProfile(data)
      } catch (error) {
        console.error('💥 Exception during profile load:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOverlay()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        closeOverlay()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeOverlay = () => {
    // Remove the account parameter from the current URL
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('account')
    router.push(currentUrl.pathname + currentUrl.search)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6">
        <div className="bg-card text-card-foreground rounded-xl shadow-xl w-[min(960px,96vw)] max-h-[80vh] overflow-hidden">
          {/* Header skeleton */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          {/* Content skeleton */}
          <div className="p-6">
            {/* Top row */}
            <div className="flex items-start gap-4 mb-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 flex flex-col justify-center h-20 gap-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            {/* Email section */}
            <div className="mb-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>

            {/* Roles */}
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6">
        <div className="bg-card text-card-foreground rounded-xl shadow-xl w-[min(960px,96vw)] h-[min(640px,80vh)] flex items-center justify-center">
          <div className="text-lg">Failed to load profile</div>
        </div>
      </div>
    )
  }

  let avatarUrl: string
  if (profile.profile_picture && profile.profile_picture.trim().length > 0) {
    avatarUrl = profile.profile_picture.startsWith('http') ? profile.profile_picture : `${API_URL}/api${profile.profile_picture}`
    console.log('🖼️ Using custom profile picture:', avatarUrl)
  } else {
    // Use the userId that was used to fetch the profile, not profile.id
    avatarUrl = `${API_URL}/api/student_formal_images/${userId}.jpg`
    console.log('🖼️ Using formal image fallback:', avatarUrl)
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6">
      <div ref={overlayRef} className="bg-card text-card-foreground rounded-xl shadow-xl w-[min(960px,96vw)] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h1 className="text-xl font-semibold">Account Information</h1>
          <Button variant="ghost" size="sm" onClick={closeOverlay}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Top row - Profile Picture, Name, Username/ID aligned to left */}
          <div className="flex items-center gap-4 mb-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground bg-muted"
                  style={{ display: 'none' }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Name and Username/ID */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold text-foreground">{profile.name}</h2>
              <div className="text-muted-foreground text-sm mt-1">
                @{profile.username} • ID: {profile.id}
              </div>
            </div>
          </div>

          {/* Email - Editable */}
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Email</div>
            <EmailEditor 
              email={profile.email} 
              userId={profile.id}
              onEmailUpdate={(newEmail) => {
                // Update the profile state
                setProfile(prev => prev ? { ...prev, email: newEmail } : null)
              }}
            />
          </div>

          {/* Additional roles as capsules */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Additional Roles</div>
            <div className="flex flex-wrap gap-2">
              {profile.additional_roles && profile.additional_roles.length > 0 ? (
                profile.additional_roles.map((role, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                  None
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 