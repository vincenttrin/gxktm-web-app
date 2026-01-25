'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEnrollment } from './EnrollmentContext';
import { WizardHeader } from './components/WizardHeader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { FamilyInfoStep } from './components/FamilyInfoStep';
import { GuardiansStep } from './components/GuardiansStep';
import { ChildrenStep } from './components/ChildrenStep';
import { EmergencyContactsStep } from './components/EmergencyContactsStep';
import { ClassSelectionStep } from './components/ClassSelectionStep';
import { ReviewStep } from './components/ReviewStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import {
  lookupFamilyByEmail,
  getFamilyForEnrollment,
  getCurrentAcademicYear,
  getClassesForEnrollment,
  getSuggestedEnrollments,
  getPrograms,
} from '@/lib/enrollmentApi';

export default function EnrollmentWizardPage() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  const {
    state,
    setUserEmail,
    setExistingFamily,
    setNewFamily,
    setOriginalFamily,
    setAcademicYear,
    setAvailableClasses,
    setPrograms,
    setSuggestedEnrollments,
    updateClassSelections,
    setLoading,
    setError,
  } = useEnrollment();
  
  // Initialize the wizard on mount
  useEffect(() => {
    async function initializeWizard() {
      try {
        setIsInitializing(true);
        setInitError(null);
        
        // Get the current user
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('No authenticated user:', userError);
          router.push('/enroll');
          return;
        }
        
        const email = user.email;
        if (!email) {
          setInitError('No email address found for your account.');
          return;
        }
        
        setUserEmail(email);
        
        // Get current academic year
        const academicYear = await getCurrentAcademicYear();
        setAcademicYear(academicYear);
        
        // Get available classes and programs
        const classesResponse = await getClassesForEnrollment(academicYear.id);
        setAvailableClasses(classesResponse.classes);
        
        const programs = await getPrograms();
        setPrograms(programs);
        
        // Look up family by email
        const lookupResult = await lookupFamilyByEmail(email);
        
        if (lookupResult.is_existing_family && lookupResult.family_id) {
          // Existing family - load their data
          setExistingFamily(lookupResult.family_id, lookupResult.family_name);
          
          // Get full family data
          const familyData = await getFamilyForEnrollment(lookupResult.family_id);
          setOriginalFamily(familyData);
          
          // Get suggested enrollments with grade progression
          const suggestions = await getSuggestedEnrollments(lookupResult.family_id);
          setSuggestedEnrollments(suggestions.suggested_enrollments);
          
          // Convert suggestions to class selections format
          const classSelections = suggestions.suggested_enrollments.flatMap(studentSuggestion => {
            const student = familyData.students.find(s => s.id === studentSuggestion.student_id);
            if (!student) return [];
            
            const selection = {
              student_id: studentSuggestion.student_id,
              giao_ly_level: null as number | null,
              viet_ngu_level: null as number | null,
              giao_ly_completed: false,
              viet_ngu_completed: false,
            };
            
            // Set suggested levels from auto-progression
            studentSuggestion.suggested_classes.forEach(cls => {
              const level = parseInt(cls.class_name.match(/\d+$/)?.[0] || '0');
              if (cls.program_name?.toLowerCase().includes('giao') || 
                  cls.program_name?.toLowerCase().includes('giáo')) {
                selection.giao_ly_level = level;
              } else if (cls.program_name?.toLowerCase().includes('viet') || 
                         cls.program_name?.toLowerCase().includes('việt')) {
                selection.viet_ngu_level = level;
              }
            });
            
            return [selection];
          });
          
          updateClassSelections(classSelections);
        } else {
          // New family - set up empty family structure
          setNewFamily();
        }
      } catch (error) {
        console.error('Error initializing wizard:', error);
        setInitError(
          error instanceof Error
            ? error.message
            : 'An error occurred while loading the enrollment portal. Please try again.'
        );
      } finally {
        setIsInitializing(false);
      }
    }
    
    initializeWizard();
  }, [
    router,
    setUserEmail,
    setExistingFamily,
    setNewFamily,
    setOriginalFamily,
    setAcademicYear,
    setAvailableClasses,
    setPrograms,
    setSuggestedEnrollments,
    updateClassSelections,
    setLoading,
    setError,
  ]);
  
  // Render loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading enrollment portal...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your information.</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Enrollment Portal</h2>
          <p className="text-gray-600 mb-6">{initError}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <button
              onClick={() => router.push('/enroll')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Return to Start
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the current step
  const renderStep = () => {
    switch (state.step) {
      case 'family-info':
        return <FamilyInfoStep />;
      case 'guardians':
        return <GuardiansStep />;
      case 'children':
        return <ChildrenStep />;
      case 'emergency-contacts':
        return <EmergencyContactsStep />;
      case 'class-selection':
        return <ClassSelectionStep />;
      case 'review':
        return <ReviewStep />;
      case 'confirmation':
        return <ConfirmationStep />;
      default:
        return <FamilyInfoStep />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <WizardHeader
        userEmail={state.userEmail}
        familyName={state.formState.family.family_name}
        academicYear={state.academicYear?.name}
      />
      
      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Indicator - hide on confirmation */}
          {state.step !== 'confirmation' && (
            <div className="mb-8">
              <ProgressIndicator currentStep={state.step} />
            </div>
          )}
          
          {/* Step Content */}
          <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
            {renderStep()}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            © 2025 GXKTM. All rights reserved. Need help?{' '}
            <a href="mailto:support@gxktm.org" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
