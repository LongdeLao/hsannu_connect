'use client'

import { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'

export function useCurrentUserId(): number | null {
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const cookieUserId = getCookie('userId')
      let currentUserId: string | number | null = cookieUserId ? String(cookieUserId) : null

      if (!currentUserId) {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored) as { id?: number | string | null }
          currentUserId = parsed?.id ?? null
        }
      }

      if (currentUserId != null) {
        const idNum = typeof currentUserId === 'string' ? parseInt(currentUserId, 10) : currentUserId
        if (!Number.isNaN(idNum)) setUserId(idNum)
      }
    } catch {
      // ignore parsing errors
    }
  }, [])

  return userId
} 