'use client'

import React, { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { API_URL } from '@/config'
import AccountOverlay from '@/components/AccountOverlay'
import { FloatingDock } from '@/components/ui/floating-dock'
import { IconCalendar, IconCalendarEvent, IconClipboardList, IconDashboard, IconSchool, IconSettings, IconUserCheck } from '@tabler/icons-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const [showAccount, setShowAccount] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; email: string; avatar: string; role: string } | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const stored = localStorage.getItem('user')
      if (!stored) return null
      const parsed = JSON.parse(stored) as { id?: number | string; name?: string; username?: string; email?: string; role?: string; profile_picture?: string }
      const name = (parsed?.name || parsed?.username || 'User').trim()
      const email = (parsed?.email || '').trim()
      const role = parsed?.role || 'student'
      const userId = parsed?.id ? String(parsed.id) : ''
      const profilePicture = parsed?.profile_picture
      let avatar: string
      if (profilePicture && profilePicture.trim().length > 0) {
        avatar = profilePicture.startsWith('http') ? profilePicture : `${API_URL}/api${profilePicture}`
      } else if (userId) {
        avatar = `${API_URL}/api/student_formal_images/${userId}.jpg`
      } else {
        avatar = '/avatars/default.jpg'
      }
      return { name, email, avatar, role }
    } catch {
      return null
    }
  })
  const [layout, setLayout] = React.useState<'sidebar' | 'dock'>('sidebar')
  const [mounted, setMounted] = React.useState(false)

  // Memoize the fallback user object to prevent recreating it on every render
  const fallbackUser = React.useMemo(() => ({ 
    name: 'User', 
    email: '', 
    avatar: '/avatars/default.jpg',
    role: 'student'
  }), [])

  React.useEffect(() => {
    setMounted(true)
    const applyStoredLayout = () => {
      const stored = (localStorage.getItem('ui-layout') as 'sidebar' | 'dock') || 'sidebar'
      setLayout(stored)
    }
    applyStoredLayout()

    const onStorage = () => {
      applyStoredLayout()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Derive showAccount from the current URL search on the client
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      setShowAccount((params.get('account') ?? '') === 'true')
    } catch {
      setShowAccount(false)
    }
  }, [pathname])

  React.useEffect(() => {
    let isCancelled = false
    const run = async () => {
      try {
        const stored = localStorage.getItem('user')
        if (!stored) return
        const parsed = JSON.parse(stored) as { id?: number | string; name?: string; username?: string; email?: string; role?: string; profile_picture?: string }
        const userId = parsed?.id ? String(parsed.id) : ''
        if (!userId) return

        const hasName = Boolean(parsed?.name && String(parsed.name).trim().length > 0)
        const hasEmail = Boolean(parsed?.email && String(parsed.email).trim().length > 0)
        const hasAvatarHint = Boolean(parsed?.profile_picture && String(parsed.profile_picture).trim().length > 0)

        // If we already have sufficient data locally, skip fetching to avoid UI flicker
        if (hasName && hasEmail && hasAvatarHint) {
          return
        }

        const resp = await fetch(`${API_URL}/api/profile/${userId}`, { cache: 'force-cache' })
        if (!resp.ok) return
        const data = await resp.json()

        const nameStr: string = (data?.name ?? parsed?.name ?? '').trim()
        const email: string = (data?.email ?? parsed?.email ?? '').trim()
        const avatarPath: string | undefined = data?.profile_picture || parsed?.profile_picture || undefined
        const role: string = (parsed?.role ?? 'student')

        let avatarUrl: string
        if (avatarPath && avatarPath.trim().length > 0) {
          avatarUrl = avatarPath.startsWith('http') ? avatarPath : `${API_URL}/api${avatarPath}`
        } else if (userId) {
          avatarUrl = `${API_URL}/api/student_formal_images/${userId}.jpg`
        } else {
          avatarUrl = '/avatars/default.jpg'
        }

        const nextUser = { name: nameStr || (parsed?.username ?? 'User'), email, avatar: avatarUrl, role }

        // Only update state if values actually changed to avoid re-renders
        setUser(prev => {
          const changed =
            !prev ||
            prev.name !== nextUser.name ||
            prev.email !== nextUser.email ||
            prev.avatar !== nextUser.avatar ||
            prev.role !== nextUser.role
          return changed && !isCancelled ? nextUser : prev
        })
      } catch {
        // no-op
      }
    }
    run()
    return () => {
      isCancelled = true
    }
  }, [])

  const baseDockItems = [
    { type: 'item' as const, title: 'Dashboard', icon: <IconDashboard className="h-5 w-5" />, href: '/shared/dashboard' },
    { type: 'item' as const, title: 'Timetable', icon: <IconCalendar className="h-5 w-5" />, href: '/shared/dashboard' },
    { type: 'item' as const, title: 'Events', icon: <IconCalendarEvent className="h-5 w-5" />, href: '/shared/dashboard' },
    { type: 'item' as const, title: 'Surveys', icon: <IconClipboardList className="h-5 w-5" />, href: '/shared/surveys' },
    { type: 'item' as const, title: 'Classes', icon: <IconSchool className="h-5 w-5" />, href: '/shared/classes' },
    { type: 'item' as const, title: 'Attendance', icon: <IconUserCheck className="h-5 w-5" />, href: '/shared/dashboard' },
    { type: 'item' as const, title: 'Settings', icon: <IconSettings className="h-5 w-5" />, href: '/shared/settings' },
  ]

  const profileItem = user
    ? { type: 'profile' as const, user: { name: user.name || 'Profile', email: user.email, avatar: user.avatar } }
    : { type: 'profile' as const, user: { name: 'Profile', email: '', avatar: '/avatars/default.jpg' } }

  const dockItems = [
    ...baseDockItems,
    { type: 'separator' as const },
    profileItem,
  ]

  // During SSR and the first client paint, we render the sidebar layout to avoid hydration mismatches.
  // After mount, if the user preference is 'dock', we switch to the dock layout on the client.
  const shouldRenderDock = mounted && layout === 'dock'

  const surveysBreadcrumb = React.useMemo(() => {
        if (!pathname.startsWith('/shared/surveys')) return null
    
    const isList = pathname === '/shared/surveys'
    const isAnalytics = /^\/shared\/surveys\/[^/]+\/stats$/.test(pathname)
    const detailMatch = pathname.match(/^\/shared\/surveys\/([^/]+)/)
    const detailId = detailMatch?.[1]

    return (
      <Breadcrumb className="ml-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            {isList ? (
              <BreadcrumbPage>Surveys</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href="/shared/surveys">Surveys</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isList && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isAnalytics && detailId ? (
                  <BreadcrumbLink asChild>
                    <Link href={`/shared/surveys/${detailId}`}>Details</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Details</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {isAnalytics && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }, [pathname])

  if (shouldRenderDock) {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="flex h-12 shrink-0 items-center px-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Student</span>
            {surveysBreadcrumb}
          </div>
        </header>
        <main className="p-3 flex-1">
          <Suspense fallback={<div className="p-4">Loading…</div>}>
            {children}
          </Suspense>
        </main>
        <div className="sticky bottom-4 left-0 right-0 z-50 flex justify-start p-2">
          <FloatingDock items={dockItems} desktopClassName="w-fit" />
        </div>
        {showAccount && <AccountOverlay />}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={user ?? fallbackUser}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center px-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="font-medium">Student</span>
            {surveysBreadcrumb}
          </div>
        </header>
        <main className="p-3">
          <Suspense fallback={<div className="p-4">Loading…</div>}>
            {children}
          </Suspense>
        </main>
      </SidebarInset>
      {showAccount && <AccountOverlay />}
    </SidebarProvider>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutContent>{children}</LayoutContent>
  )
} 