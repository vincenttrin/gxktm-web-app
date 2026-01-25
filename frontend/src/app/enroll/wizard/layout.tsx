'use client';

import { EnrollmentProvider } from './EnrollmentContext';

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EnrollmentProvider>
      {children}
    </EnrollmentProvider>
  );
}
