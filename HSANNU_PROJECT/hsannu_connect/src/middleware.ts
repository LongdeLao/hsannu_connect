import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/login' || 
    path === '/forgot-password' || 
    path === '/reset-password' || 
    path === '/verify-code' ||
    // legacy/alternate path kept for compatibility
    path === '/verify-reset-code' ||
    path === '/privacy-en' ||
    path === '/privacy-cn' ||
    path.startsWith('/_next') || 
    path.startsWith('/api') ||
    path.includes('.')  // For static files

  // Check if user is logged in (from cookie)
  const isLoggedIn = request.cookies.get('loggedIn')?.value === 'true'
  
  // Get user role from cookie if available
  const userRole = request.cookies.get('userRole')?.value

  // Redirect logic
  // Root path: send users to login or their role home
  if (path === '/') {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student', request.url))
    } else if (userRole === 'staff' || userRole === 'teacher' || userRole === 'admin') {
      return NextResponse.redirect(new URL('/staff', request.url))
    } else {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  if (!isPublicPath && !isLoggedIn) {
    // If trying to access a protected route without being logged in, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (isLoggedIn && path === '/login') {
    // If already logged in and trying to access login page, redirect to dashboard
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student', request.url))
    } else if (userRole === 'staff' || userRole === 'teacher' || userRole === 'admin') {
      return NextResponse.redirect(new URL('/staff', request.url))
    } else {
      // Default to student if role is unknown
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  // Role-based access control
  if (isLoggedIn) {
    // Staff-only routes
    if (path.startsWith('/staff') && userRole !== 'staff' && userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/student', request.url))
    }

    // Student-only routes
    if (path.startsWith('/student') && userRole === 'staff') {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes should trigger this middleware
export const config = {
  matcher: [
    // Match all paths except for:
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 