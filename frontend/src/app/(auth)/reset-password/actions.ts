'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Verify user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/forgot-password?error=Session expired. Please request a new reset link.')
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    redirect('/reset-password?error=Passwords do not match')
  }

  // Validate password length
  if (password.length < 6) {
    redirect('/reset-password?error=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Password update error:', error)
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  // Sign out the user after password reset for security
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login?message=Password updated successfully. Please sign in with your new password.')
}
