import { redirect } from 'next/navigation'

// Redirect to admin login - this old page is deprecated
export default async function LoginPage() {
  redirect('/admin/login')
}

