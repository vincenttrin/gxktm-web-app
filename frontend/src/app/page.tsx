import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    // Not authenticated - redirect to login
    redirect('/login');
  }
  
  if (user.isAdmin) {
    // Admin users go to dashboard
    redirect('/dashboard');
  } else {
    // Regular users go to enrollment wizard
    redirect('/enroll/wizard');
  }
}