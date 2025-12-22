"use client"

import {
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  // AvatarImage, // replaced by next/image for caching
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { deleteCookie } from 'cookies-next'
import type { UserRole } from "@/lib/navigation"
import React from "react"
import Image from "next/image"
import { getCachedAvatarDataUrl, cacheAvatarDataUrl } from "@/lib/avatar-cache"

export function NavUser({
  user,
}: {
  user: UserRole
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleAccountClick = () => {
    // Add account=true to the current route
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('account', 'true')
    router.push(currentUrl.pathname + currentUrl.search)
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('user')
    
    // Clear cookies
    deleteCookie('userId')
    deleteCookie('userRole')
    
    // Navigate to login page
    router.push('/login')
  }

  const [avatarErrored, setAvatarErrored] = React.useState(false)
  const [displayAvatar, setDisplayAvatar] = React.useState<string>(() => {
    try {
      if (typeof window === 'undefined') return user.avatar
      const stored = localStorage.getItem('user')
      if (!stored) return user.avatar
      const parsed = JSON.parse(stored) as { id?: string | number }
      const uid = parsed?.id ? String(parsed.id) : ''
      const cached = uid ? getCachedAvatarDataUrl(uid) : null
      return cached || user.avatar
    } catch {
      return user.avatar
    }
  })

  React.useEffect(() => {
    let isCancelled = false
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return
      const parsed = JSON.parse(stored) as { id?: string | number }
      const uid = parsed?.id ? String(parsed.id) : ''
      if (!uid) return
      // Refresh cache in background
      cacheAvatarDataUrl(uid, user.avatar).then(() => {
        if (isCancelled) return
        const cached = getCachedAvatarDataUrl(uid)
        if (cached) setDisplayAvatar(prev => (prev !== cached ? cached : prev))
      })
    } catch {
      // no-op
    }
    return () => { isCancelled = true }
  }, [user.avatar])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg overflow-hidden">
                {avatarErrored || !displayAvatar ? (
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                ) : (
                  <Image
                    src={displayAvatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    priority
                    onError={() => setAvatarErrored(true)}
                  />
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg overflow-hidden">
                  {avatarErrored || !displayAvatar ? (
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  ) : (
                    <Image
                      src={displayAvatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarErrored(true)}
                    />
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccountClick} className="cursor-pointer">
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
