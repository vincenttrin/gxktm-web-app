import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth',
    '/forgot-password',
    '/reset-password',
    '/enroll', // Enrollment landing page (before auth)
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
    // Otherwise redirect to admin login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on enrollment landing page, redirect to wizard
  if (user && request.nextUrl.pathname === '/enroll') {
    const url = request.nextUrl.clone()
    url.pathname = '/enroll/wizard'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access admin login/signup, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
