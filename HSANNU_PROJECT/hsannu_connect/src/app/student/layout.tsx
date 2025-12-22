'use client'

import React from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center px-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="font-medium">Student</span>
          </div>
        </header>
        <main className="p-3">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 
 