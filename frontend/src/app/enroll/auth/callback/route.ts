import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${origin}/enroll?error=${encodeURIComponent(error_description || 'Authentication failed')}`
    );
  }

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Session exchange error:', exchangeError);
      return NextResponse.redirect(
        `${origin}/enroll?error=${encodeURIComponent('Failed to authenticate. Please try again.')}`
      );
    }

    // Successfully authenticated - redirect to the enrollment wizard
    // The wizard will handle the family lookup and determine the flow
    return NextResponse.redirect(`${origin}/enroll/wizard`);
  }

  // No code or error - redirect back to enrollment landing
  return NextResponse.redirect(`${origin}/enroll`);
}
