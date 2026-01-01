"use client"

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

export default function LayoutClient({ children, initialLayout }: { children: React.ReactNode; initialLayout: 'sidebar' | 'dock' }) {
	const pathname = usePathname() || ''
	const [showAccount, setShowAccount] = React.useState(false)
	const [layout, setLayout] = React.useState<'sidebar' | 'dock'>(initialLayout)
	
	// Memoize the fallback user object to prevent recreating it on every render
	const fallbackUser = React.useMemo(() => ({ 
		name: 'User', 
		email: '', 
		avatar: '/avatars/default.jpg',
		role: 'student'
	}), [])

	// Initialize with fallback user to ensure consistent server/client render
	const [user, setUser] = React.useState(fallbackUser)

	// Move user initialization to useEffect to ensure it only runs on client
	React.useEffect(() => {
		try {
			const stored = localStorage.getItem('user')
			if (!stored) return
			
			const parsed = JSON.parse(stored) as { 
				id?: number | string
				name?: string
				username?: string
				email?: string
				role?: string
				profile_picture?: string 
			}
			
			const name = (parsed?.name || parsed?.username || 'User').trim()
			const email = (parsed?.email || '').trim()
			const role = parsed?.role || 'student'
			const userId = parsed?.id ? String(parsed.id) : ''
			// For privacy purposes, always use placeholder avatar
			const avatar = '/avatars/default.jpg'
			
			setUser({ name, email, avatar, role })
		} catch {
			// Keep fallback user on error
		}
	}, [])

	React.useEffect(() => {
		const applyStoredLayout = () => {
			const stored = (localStorage.getItem('ui-layout') as 'sidebar' | 'dock') || initialLayout
			setLayout(stored)
		}
		applyStoredLayout()

		const onStorage = () => {
			applyStoredLayout()
		}
		window.addEventListener('storage', onStorage)
		return () => window.removeEventListener('storage', onStorage)
	}, [initialLayout])

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

	const baseDockItems = [
{ type: 'item' as const, title: 'Timetable', icon: <IconCalendar className="h-5 w-5" />, href: user.role === 'staff' ? '/staff/timetable' : '/student/timetable' },
		{ type: 'item' as const, title: 'Events', icon: <IconCalendarEvent className="h-5 w-5" />, href: '/shared/events' },
		{ type: 'item' as const, title: 'Surveys', icon: <IconClipboardList className="h-5 w-5" />, href: '/shared/surveys' },
		{ type: 'item' as const, title: 'Classes', icon: <IconSchool className="h-5 w-5" />, href: user.role === 'staff' ? '/staff/classes' : '/student/classes' },
		{ type: 'item' as const, title: 'Attendance', icon: <IconUserCheck className="h-5 w-5" />, href: user.role === 'staff' ? '/staff/attendance' : '/student/attendance' },
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

	const shouldRenderDock = layout === 'dock'

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
			<AppSidebar user={user} />
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