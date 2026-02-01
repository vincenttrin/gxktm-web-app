import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper to extract user role from Supabase user
function getUserRole(user: { app_metadata?: { role?: string }; user_metadata?: { role?: string } } | null): string {
  if (!user) return 'user';
  return user.app_metadata?.role || user.user_metadata?.role || 'user';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user role
  const userRole = getUserRole(user)
  const isAdmin = userRole === 'admin'

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth',
    '/forgot-password',
    '/reset-password',
    '/enroll', // Enrollment landing page (before auth)
    '/admin/login', // Admin login page
    '/admin/setup', // Initial admin setup page
  ]

  // Define admin-only routes
  const adminRoutes = [
    '/dashboard',
  ]

  // Define enrollment routes that need special handling
  const enrollmentAuthRoutes = [
    '/enroll/auth', // Enrollment auth callback
  ]

  // Define protected enrollment routes (require authentication)
  const protectedEnrollmentRoutes = [
    '/enroll/wizard',
  ]

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  const isAdminRoute = adminRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  const isEnrollmentAuthRoute = enrollmentAuthRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  const isProtectedEnrollmentRoute = protectedEnrollmentRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Allow enrollment auth callback to proceed
  if (isEnrollmentAuthRoute) {
    return supabaseResponse
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    // If trying to access protected enrollment route, redirect to enrollment landing
    if (isProtectedEnrollmentRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/enroll'
      return NextResponse.redirect(url)
    }
    // If trying to access admin routes, redirect to admin login
    if (isAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    // Otherwise redirect to admin login
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // If authenticated user tries to access admin routes but is not an admin
  if (user && isAdminRoute && !isAdmin) {
    // Redirect non-admin users to enrollment wizard or home
    const url = request.nextUrl.clone()
    url.pathname = '/enroll/wizard'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on enrollment landing page, redirect to wizard
  if (user && request.nextUrl.pathname === '/enroll') {
    const url = request.nextUrl.clone()
    url.pathname = '/enroll/wizard'
    return NextResponse.redirect(url)
  }

  // If admin user is on admin login page, redirect to dashboard
  if (user && isAdmin && request.nextUrl.pathname === '/admin/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If regular user is on admin login page, let them try to login
  // (they might be an admin who needs to authenticate)

  // If user is authenticated and trying to access admin login/signup, redirect appropriately
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    // Redirect based on role
    if (isAdmin) {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/enroll/wizard'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
