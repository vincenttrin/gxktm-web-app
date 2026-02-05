import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'admin' | 'user';

/**
 * Extract user role from Supabase user metadata
 */
function getUserRole(userMetadata: Record<string, unknown> | undefined): UserRole {
  if (!userMetadata) return 'user';
  return (userMetadata.role as UserRole) || 'user';
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
    error: authError,
  } = await supabase.auth.getUser()

  // If there's an auth error, treat as unauthenticated
  // This handles cases where cookies exist but session is invalid/expired
  const authenticatedUser = authError ? null : user;

  // Get user role from metadata
  const userRole = authenticatedUser ? getUserRole(authenticatedUser.user_metadata) : null;
  const isAdmin = userRole === 'admin';

  // Define public routes that don't require authentication (only auth-related pages)
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth',
    '/forgot-password',
    '/reset-password',
  ]

  // Define admin-only routes (require admin role)
  const adminOnlyRoutes = [
    '/dashboard',
  ]

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // If user is not authenticated and trying to access any non-public route, redirect to login
  if (!authenticatedUser && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve the original destination for redirect after login
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated but not admin and trying to access admin route
  if (authenticatedUser && isAdminOnlyRoute && !isAdmin) {
    // Redirect non-admin users to unauthorized page or home
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // If authenticated user is on login/signup page, redirect appropriately
  if (authenticatedUser && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/dashboard' : '/enroll/wizard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
