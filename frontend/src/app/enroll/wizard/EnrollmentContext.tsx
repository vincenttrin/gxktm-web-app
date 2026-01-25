'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  EnrollmentWizardState,
  EnrollmentStep,
  EnrollmentFamily,
  EnrollmentGuardian,
  EnrollmentStudent,
  EnrollmentEmergencyContact,
  EnrollmentClass,
  StudentEnrollmentSuggestion,
  AcademicYear,
  Program,
  ClassSelection,
  FormState,
  ChangesSummary,
} from '@/types/enrollment';

// Initial form state
const createInitialFormState = (): FormState => ({
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
  guardians: [],
  children: [],
  emergencyContacts: [],
  classSelections: [],
  validation: {
    family: { isValid: true, errors: {} },
    guardians: { isValid: true, errors: {} },
    children: { isValid: true, errors: {} },
    emergencyContacts: { isValid: true, errors: {} },
    classSelections: { isValid: true, errors: {} },
  },
});

// Initial state
const initialState: EnrollmentWizardState = {
  step: 'family-info',
  userEmail: null,
  isExistingFamily: false,
  familyId: null,
  originalFamily: null,
  formState: createInitialFormState(),
  academicYear: null,
  availableClasses: [],
  programs: [],
  suggestedEnrollments: [],
  changesSummary: null,
  isLoading: false,
  error: null,
  isSubmitting: false,
};

// Action types
type EnrollmentAction =
  | { type: 'SET_USER_EMAIL'; payload: string }
  | { type: 'SET_EXISTING_FAMILY'; payload: { familyId: string; familyName: string | null } }
  | { type: 'SET_NEW_FAMILY' }
  | { type: 'SET_ORIGINAL_FAMILY'; payload: EnrollmentFamily }
  | { type: 'UPDATE_FORM_FAMILY'; payload: Partial<EnrollmentFamily> }
  | { type: 'UPDATE_FORM_GUARDIANS'; payload: EnrollmentGuardian[] }
  | { type: 'UPDATE_FORM_CHILDREN'; payload: EnrollmentStudent[] }
  | { type: 'UPDATE_FORM_EMERGENCY_CONTACTS'; payload: EnrollmentEmergencyContact[] }
  | { type: 'UPDATE_CLASS_SELECTIONS'; payload: ClassSelection[] }
  | { type: 'SET_ACADEMIC_YEAR'; payload: AcademicYear }
  | { type: 'SET_AVAILABLE_CLASSES'; payload: EnrollmentClass[] }
  | { type: 'SET_PROGRAMS'; payload: Program[] }
  | { type: 'SET_SUGGESTED_ENROLLMENTS'; payload: StudentEnrollmentSuggestion[] }
  | { type: 'SET_CHANGES_SUMMARY'; payload: ChangesSummary }
  | { type: 'SET_STEP'; payload: EnrollmentStep }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUBMITTING'; payload: boolean }
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
        formState: createInitialFormState(),
      };
    
    case 'SET_ORIGINAL_FAMILY':
      return { 
        ...state, 
        originalFamily: action.payload,
        formState: {
          ...state.formState,
          family: action.payload,
          guardians: action.payload.guardians,
          children: action.payload.students,
          emergencyContacts: action.payload.emergency_contacts,
        },
      };
    
    case 'UPDATE_FORM_FAMILY':
      return {
        ...state,
        formState: {
          ...state.formState,
          family: { ...state.formState.family, ...action.payload },
        },
      };
    
    case 'UPDATE_FORM_GUARDIANS':
      return {
        ...state,
        formState: {
          ...state.formState,
          guardians: action.payload,
        },
      };
    
    case 'UPDATE_FORM_CHILDREN':
      return {
        ...state,
        formState: {
          ...state.formState,
          children: action.payload,
        },
      };
    
    case 'UPDATE_FORM_EMERGENCY_CONTACTS':
      return {
        ...state,
        formState: {
          ...state.formState,
          emergencyContacts: action.payload,
        },
      };
    
    case 'UPDATE_CLASS_SELECTIONS':
      return {
        ...state,
        formState: {
          ...state.formState,
          classSelections: action.payload,
        },
      };
    
    case 'SET_ACADEMIC_YEAR':
      return { ...state, academicYear: action.payload };
    
    case 'SET_AVAILABLE_CLASSES':
      return { ...state, availableClasses: action.payload };
    
    case 'SET_PROGRAMS':
      return { ...state, programs: action.payload };
    
    case 'SET_SUGGESTED_ENROLLMENTS':
      return { ...state, suggestedEnrollments: action.payload };
    
    case 'SET_CHANGES_SUMMARY':
      return { ...state, changesSummary: action.payload };
    
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Context type
interface EnrollmentContextType {
  state: EnrollmentWizardState;
  
  // User and family setup
  setUserEmail: (email: string) => void;
  setExistingFamily: (familyId: string, familyName: string | null) => void;
  setNewFamily: () => void;
  setOriginalFamily: (family: EnrollmentFamily) => void;
  
  // Form updates
  updateFormFamily: (updates: Partial<EnrollmentFamily>) => void;
  updateFormGuardians: (guardians: EnrollmentGuardian[]) => void;
  updateFormChildren: (children: EnrollmentStudent[]) => void;
  updateFormEmergencyContacts: (contacts: EnrollmentEmergencyContact[]) => void;
  updateClassSelections: (selections: ClassSelection[]) => void;
  
  // Academic year and classes
  setAcademicYear: (year: AcademicYear) => void;
  setAvailableClasses: (classes: EnrollmentClass[]) => void;
  setPrograms: (programs: Program[]) => void;
  setSuggestedEnrollments: (suggestions: StudentEnrollmentSuggestion[]) => void;
  
  // Changes and review
  setChangesSummary: (summary: ChangesSummary) => void;
  
  // Navigation
  setStep: (step: EnrollmentStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

// Create context
const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

// Step order for navigation
const stepOrder: EnrollmentStep[] = ['family-info', 'guardians', 'children', 'emergency-contacts', 'class-selection', 'review', 'confirmation'];

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

  const setOriginalFamily = useCallback((family: EnrollmentFamily) => {
    dispatch({ type: 'SET_ORIGINAL_FAMILY', payload: family });
  }, []);

  const updateFormFamily = useCallback((updates: Partial<EnrollmentFamily>) => {
    dispatch({ type: 'UPDATE_FORM_FAMILY', payload: updates });
  }, []);

  const updateFormGuardians = useCallback((guardians: EnrollmentGuardian[]) => {
    dispatch({ type: 'UPDATE_FORM_GUARDIANS', payload: guardians });
  }, []);

  const updateFormChildren = useCallback((children: EnrollmentStudent[]) => {
    dispatch({ type: 'UPDATE_FORM_CHILDREN', payload: children });
  }, []);

  const updateFormEmergencyContacts = useCallback((contacts: EnrollmentEmergencyContact[]) => {
    dispatch({ type: 'UPDATE_FORM_EMERGENCY_CONTACTS', payload: contacts });
  }, []);

  const updateClassSelections = useCallback((selections: ClassSelection[]) => {
    dispatch({ type: 'UPDATE_CLASS_SELECTIONS', payload: selections });
  }, []);

  const setAcademicYear = useCallback((year: AcademicYear) => {
    dispatch({ type: 'SET_ACADEMIC_YEAR', payload: year });
  }, []);

  const setAvailableClasses = useCallback((classes: EnrollmentClass[]) => {
    dispatch({ type: 'SET_AVAILABLE_CLASSES', payload: classes });
  }, []);

  const setPrograms = useCallback((programs: Program[]) => {
    dispatch({ type: 'SET_PROGRAMS', payload: programs });
  }, []);

  const setSuggestedEnrollments = useCallback((suggestions: StudentEnrollmentSuggestion[]) => {
    dispatch({ type: 'SET_SUGGESTED_ENROLLMENTS', payload: suggestions });
  }, []);

  const setChangesSummary = useCallback((summary: ChangesSummary) => {
    dispatch({ type: 'SET_CHANGES_SUMMARY', payload: summary });
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

  const setSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: submitting });
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
    setOriginalFamily,
    updateFormFamily,
    updateFormGuardians,
    updateFormChildren,
    updateFormEmergencyContacts,
    updateClassSelections,
    setAcademicYear,
    setAvailableClasses,
    setPrograms,
    setSuggestedEnrollments,
    setChangesSummary,
    setStep,
    setLoading,
    setError,
    setSubmitting,
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
