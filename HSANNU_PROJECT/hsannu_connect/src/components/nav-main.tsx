"use client"

import React from "react"
import Link from "next/link"
import { IconChevronRight } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { NavigationItem } from "@/lib/navigation"

export const NavMain = React.memo(function NavMain({
  items,
}: {
  items: NavigationItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            if (item.items) {
              // Dropdown item with sub-items
              return (
                <Collapsible key={item.title} asChild defaultOpen={false}>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip={item.title} asChild>
                      <CollapsibleTrigger className="flex w-full items-center gap-2">
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            } else {
              // Regular navigation item
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url!} className="flex items-center gap-2">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})
