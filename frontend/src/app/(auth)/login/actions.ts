'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  
  // Check user role and redirect accordingly
  const userRole = data.user?.user_metadata?.role || 'user'
  
  if (userRole === 'admin') {
    redirect('/dashboard')
  } else {
    redirect('/enroll/wizard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // New users default to 'user' role
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'user',
      },
    },
  })

  if (error) {
    redirect('/signup?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
