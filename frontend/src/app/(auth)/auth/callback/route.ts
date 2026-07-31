import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const baseUrl = configuredSiteUrl || (forwardedHost ? `https://${forwardedHost}` : origin)

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        return NextResponse.redirect(`${baseUrl}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
