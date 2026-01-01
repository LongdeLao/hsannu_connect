import React from 'react'
import { cookies } from 'next/headers'
import LayoutClient from './LayoutClient'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies()
	const layoutCookie = cookieStore.get('ui-layout')?.value
	const initialLayout = (layoutCookie === 'dock' || layoutCookie === 'sidebar') ? layoutCookie : 'sidebar'
	return (
		<LayoutClient initialLayout={initialLayout}>{children}</LayoutClient>
	)
} 