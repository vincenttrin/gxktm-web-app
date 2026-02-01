'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

/**
 * Admin login action - uses email/password authentication.
 * After successful login, verifies that the user has admin role.
 */
export async function adminLogin(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/admin/login?error=' + encodeURIComponent('Invalid email or password'))
  }

  // Check if user has admin role
  const user = data.user
  const role = user?.app_metadata?.role || user?.user_metadata?.role || 'user'

  if (role !== 'admin') {
    // Sign out non-admin users
    await supabase.auth.signOut()
    redirect('/admin/login?error=' + encodeURIComponent('Access denied. Admin privileges required.'))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Admin logout action.
 */
export async function adminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}
