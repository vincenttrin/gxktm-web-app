'use client';

import { ENROLLMENT_STEPS, EnrollmentStep } from '@/types/enrollment';

interface ProgressIndicatorProps {
  currentStep: EnrollmentStep;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  // Use all wizard steps (confirmation is the last step)
  const wizardSteps = ENROLLMENT_STEPS.filter(step => step.id !== 'confirmation');
  
  const currentStepIndex = wizardSteps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="w-full">
      {/* Mobile: Simple step indicator */}
      <div className="flex items-center justify-center gap-2 sm:hidden mb-6">
        <span className="text-sm font-medium text-gray-900">
          Step {currentStepIndex + 1} of {wizardSteps.length}
        </span>
        <span className="text-sm text-gray-500">
          - {wizardSteps[currentStepIndex]?.title}
        </span>
      </div>
      
      {/* Desktop: Full progress bar */}
      <div className="hidden sm:block">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {wizardSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = step.id === currentStep;
              
              return (
                <li key={step.id} className="relative flex-1">
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={`absolute top-5 left-0 right-1/2 h-0.5 -translate-y-1/2 ${
                        isCompleted || isCurrent ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  {index < wizardSteps.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  
                  <div className="relative flex flex-col items-center">
                    {/* Step circle */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : isCurrent
                          ? 'border-blue-600 bg-white text-blue-600'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Step label */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs font-medium ${
                          isCurrent
                            ? 'text-blue-600'
                            : isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      
      {/* Progress bar (mobile-friendly) */}
      <div className="mt-4 sm:hidden">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / wizardSteps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
