"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getNavigationForRole, getNavigationForRoleAsync, getCurrentUser, getCurrentUserRole, type UserRole } from "@/lib/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserRole
}

export const AppSidebar = React.memo(function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { user: authUser } = useAuth()
  
  // Memoize the user role to prevent unnecessary navigation reloads
  const userRole = React.useMemo(() => {
    // Use authUser from context first, then passed user prop, then fallback to localStorage
    if (authUser?.role) return authUser.role
    if (user?.role) return user.role
    return getCurrentUserRole()
  }, [authUser?.role, user?.role])

  // Memoize the current user to prevent unnecessary re-renders
  const memoizedCurrentUser = React.useMemo(() => {
    if (authUser) {
      return {
        role: authUser.role,
        name: authUser.name,
        email: authUser.email || '',
        avatar: '/avatars/default.jpg', // Always use placeholder for privacy
      } as UserRole
    }
    return user || getCurrentUser()
  }, [authUser, user, userRole])

  // Initialize navigation with a synchronous fallback to avoid empty first render
  const [navigationData, setNavigationData] = useState(() => getNavigationForRole(userRole))

  useEffect(() => {
    async function loadNavigation() {
      try {
        // Try to get dynamic navigation (async)
        const navigation = await getNavigationForRoleAsync(userRole)
        setNavigationData(navigation)
      } catch (error) {
        console.error('Failed to load dynamic navigation, using fallback:', error)
        // Fallback to static navigation
        const navigation = getNavigationForRole(userRole)
        setNavigationData(navigation)
      }
    }

    loadNavigation()
  }, [userRole])

  return (
    <Sidebar collapsible="offcanvas" className="pt-2 pl-1" {...props}>
      <SidebarHeader className="pt-1 pl-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Image src="/logo.png" alt="HSANNU" width={20} height={20} className="rounded-sm" priority unoptimized />
                <span className="text-base font-semibold">HSANNU</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pl-1">
        <NavMain items={navigationData.main} />
        <NavDocuments items={navigationData.documents} />
        <NavSecondary items={navigationData.secondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="pl-1 pb-2">
        <NavUser user={memoizedCurrentUser || {
          role: 'student',
          name: 'User',
          email: 'user@hsannu.com',
          avatar: '/avatars/default.jpg'
        }} />
      </SidebarFooter>
    </Sidebar>
  )
})
 