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
import type { UserRole } from "@/lib/navigation"
import React from "react"
import Image from "next/image"
import { getCachedAvatarDataUrl, cacheAvatarDataUrl } from "@/lib/avatar-cache"
import { useAuth } from "@/contexts/auth-context"

export function NavUser({
  user,
}: {
  user: UserRole
}) {
  const { logout } = useAuth()
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
    // Use auth context logout function
    logout()
  }

  const [avatarErrored, setAvatarErrored] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const [displayAvatar, setDisplayAvatar] = React.useState<string | null>(null)

  React.useEffect(() => {
    setIsClient(true)
    try {
      const stored = localStorage.getItem('user')
      if (!stored) {
        setDisplayAvatar(user.avatar)
        return
      }
      const parsed = JSON.parse(stored) as { id?: string | number }
      const uid = parsed?.id ? String(parsed.id) : ''
      if (!uid) {
        setDisplayAvatar(user.avatar)
        return
      }
      const cached = getCachedAvatarDataUrl(uid)
      setDisplayAvatar(cached || user.avatar)

      // Refresh cache in background
      cacheAvatarDataUrl(uid, user.avatar).then(() => {
        const refreshedCache = getCachedAvatarDataUrl(uid)
        if (refreshedCache) setDisplayAvatar(refreshedCache)
      })
    } catch {
      setDisplayAvatar(user.avatar)
    }
  }, [user.avatar])

  const renderAvatar = (size: number) => (
    <Avatar className={`h-${size} w-${size} rounded-lg overflow-hidden`}>
      {!isClient || avatarErrored || !displayAvatar ? (
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      ) : (
        <Image
          src={displayAvatar}
          alt={user.name}
          width={size * 4}
          height={size * 4}
          className="h-full w-full object-cover"
          onError={() => setAvatarErrored(true)}
        />
      )}
    </Avatar>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {renderAvatar(8)}
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
                {renderAvatar(8)}
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
