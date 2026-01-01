'use client'

import React from 'react'
import LayoutClient from '../shared/LayoutClient'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  // Get the layout preference from localStorage on client side
  const [initialLayout, setInitialLayout] = React.useState<'sidebar' | 'dock'>('sidebar')
  
  React.useEffect(() => {
    const stored = localStorage.getItem('ui-layout')
    if (stored === 'dock' || stored === 'sidebar') {
      setInitialLayout(stored)
    }
  }, [])
  
  return (
    <LayoutClient initialLayout={initialLayout}>{children}</LayoutClient>
  )
} 
 