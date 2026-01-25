'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  EnrollmentWizardState,
  EnrollmentStep,
  EnrollmentFamily,
  EnrollmentClass,
  StudentEnrollmentSuggestion,
  SelectedEnrollment,
  AcademicYear,
} from '@/types/enrollment';

// Initial state
const initialState: EnrollmentWizardState = {
  step: 'family-info', // After auth, we start at family-info
  userEmail: null,
  isExistingFamily: false,
  familyId: null,
  family: null,
  academicYear: null,
  availableClasses: [],
  suggestedEnrollments: [],
  selectedEnrollments: [],
  isLoading: false,
  error: null,
};

// Action types
type EnrollmentAction =
  | { type: 'SET_USER_EMAIL'; payload: string }
  | { type: 'SET_EXISTING_FAMILY'; payload: { familyId: string; familyName: string | null } }
  | { type: 'SET_NEW_FAMILY' }
  | { type: 'SET_FAMILY'; payload: EnrollmentFamily }
  | { type: 'SET_ACADEMIC_YEAR'; payload: AcademicYear }
  | { type: 'SET_AVAILABLE_CLASSES'; payload: EnrollmentClass[] }
  | { type: 'SET_SUGGESTED_ENROLLMENTS'; payload: StudentEnrollmentSuggestion[] }
  | { type: 'SET_SELECTED_ENROLLMENTS'; payload: SelectedEnrollment[] }
  | { type: 'ADD_ENROLLMENT'; payload: SelectedEnrollment }
  | { type: 'REMOVE_ENROLLMENT'; payload: { studentId: string; classId: string } }
  | { type: 'SET_STEP'; payload: EnrollmentStep }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Reducer
function enrollmentReducer(state: EnrollmentWizardState, action: EnrollmentAction): EnrollmentWizardState {
  switch (action.type) {
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.payload };
    
    case 'SET_EXISTING_FAMILY':
      return {
        ...state,
        isExistingFamily: true,
        familyId: action.payload.familyId,
      };
    
    case 'SET_NEW_FAMILY':
      return {
        ...state,
        isExistingFamily: false,
        familyId: null,
        family: {
          family_name: null,
          address: null,
          city: null,
          state: null,
          zip_code: null,
          diocese_id: null,
          guardians: [],
          students: [],
          emergency_contacts: [],
        },
      };
    
    case 'SET_FAMILY':
      return { ...state, family: action.payload };
    
    case 'SET_ACADEMIC_YEAR':
      return { ...state, academicYear: action.payload };
    
    case 'SET_AVAILABLE_CLASSES':
      return { ...state, availableClasses: action.payload };
    
    case 'SET_SUGGESTED_ENROLLMENTS':
      return { ...state, suggestedEnrollments: action.payload };
    
    case 'SET_SELECTED_ENROLLMENTS':
      return { ...state, selectedEnrollments: action.payload };
    
    case 'ADD_ENROLLMENT':
      // Prevent duplicate enrollments
      const exists = state.selectedEnrollments.some(
        (e) => e.student_id === action.payload.student_id && e.class_id === action.payload.class_id
      );
      if (exists) return state;
      return {
        ...state,
        selectedEnrollments: [...state.selectedEnrollments, action.payload],
      };
    
    case 'REMOVE_ENROLLMENT':
      return {
        ...state,
        selectedEnrollments: state.selectedEnrollments.filter(
          (e) => !(e.student_id === action.payload.studentId && e.class_id === action.payload.classId)
        ),
      };
    
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Context type
interface EnrollmentContextType {
  state: EnrollmentWizardState;
  setUserEmail: (email: string) => void;
  setExistingFamily: (familyId: string, familyName: string | null) => void;
  setNewFamily: () => void;
  setFamily: (family: EnrollmentFamily) => void;
  setAcademicYear: (year: AcademicYear) => void;
  setAvailableClasses: (classes: EnrollmentClass[]) => void;
  setSuggestedEnrollments: (suggestions: StudentEnrollmentSuggestion[]) => void;
  setSelectedEnrollments: (enrollments: SelectedEnrollment[]) => void;
  addEnrollment: (enrollment: SelectedEnrollment) => void;
  removeEnrollment: (studentId: string, classId: string) => void;
  setStep: (step: EnrollmentStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

// Create context
const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

// Step order for navigation
const stepOrder: EnrollmentStep[] = ['family-info', 'class-selection', 'review', 'confirmation'];

// Provider component
export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(enrollmentReducer, initialState);

  const setUserEmail = useCallback((email: string) => {
    dispatch({ type: 'SET_USER_EMAIL', payload: email });
  }, []);

  const setExistingFamily = useCallback((familyId: string, familyName: string | null) => {
    dispatch({ type: 'SET_EXISTING_FAMILY', payload: { familyId, familyName } });
  }, []);

  const setNewFamily = useCallback(() => {
    dispatch({ type: 'SET_NEW_FAMILY' });
  }, []);

  const setFamily = useCallback((family: EnrollmentFamily) => {
    dispatch({ type: 'SET_FAMILY', payload: family });
  }, []);

  const setAcademicYear = useCallback((year: AcademicYear) => {
    dispatch({ type: 'SET_ACADEMIC_YEAR', payload: year });
  }, []);

  const setAvailableClasses = useCallback((classes: EnrollmentClass[]) => {
    dispatch({ type: 'SET_AVAILABLE_CLASSES', payload: classes });
  }, []);

  const setSuggestedEnrollments = useCallback((suggestions: StudentEnrollmentSuggestion[]) => {
    dispatch({ type: 'SET_SUGGESTED_ENROLLMENTS', payload: suggestions });
  }, []);

  const setSelectedEnrollments = useCallback((enrollments: SelectedEnrollment[]) => {
    dispatch({ type: 'SET_SELECTED_ENROLLMENTS', payload: enrollments });
  }, []);

  const addEnrollment = useCallback((enrollment: SelectedEnrollment) => {
    dispatch({ type: 'ADD_ENROLLMENT', payload: enrollment });
  }, []);

  const removeEnrollment = useCallback((studentId: string, classId: string) => {
    dispatch({ type: 'REMOVE_ENROLLMENT', payload: { studentId, classId } });
  }, []);

  const setStep = useCallback((step: EnrollmentStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex + 1] });
    }
  }, [state.step]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex - 1] });
    }
  }, [state.step]);

  const value: EnrollmentContextType = {
    state,
    setUserEmail,
    setExistingFamily,
    setNewFamily,
    setFamily,
    setAcademicYear,
    setAvailableClasses,
    setSuggestedEnrollments,
    setSelectedEnrollments,
    addEnrollment,
    removeEnrollment,
    setStep,
    setLoading,
    setError,
    reset,
    goToNextStep,
    goToPreviousStep,
  };

  return (
    <EnrollmentContext.Provider value={value}>
      {children}
    </EnrollmentContext.Provider>
  );
}

// Hook to use enrollment context
export function useEnrollment() {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
}
