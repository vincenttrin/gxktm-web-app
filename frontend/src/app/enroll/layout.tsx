import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment Portal - GXKTM',
  description: 'Enroll your children in our Vietnamese language and religious education classes',
};

export default function EnrollmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {children}
    </div>
  );
}
