import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface FundingProgressProps {
  currentStep: number;
}

// Updated steps array with descriptions and renamed step 3
const steps = [
  { id: 1, label: 'Define Need', description: 'Clarify your funding goals and amount.' },
  { id: 2, label: 'Check Affordability', description: 'Assess your capacity based on cash flow.' },
  { id: 3, label: 'Loan Package', description: 'Compile documents including cover letter.' }, 
  { id: 4, label: 'Match Lenders', description: 'Identify lenders aligned with your profile.' },
  { id: 5, label: 'Submit & Follow-Up', description: 'Present your package and manage communication.' },
  { id: 6, label: 'Secure Funding', description: 'Finalize terms and receive funds.' },
];

const FundingProgress: React.FC<FundingProgressProps> = ({ currentStep }) => {
  if (currentStep < 1 || currentStep > steps.length) {
    console.warn(`FundingProgress: Invalid currentStep prop (${currentStep}). Must be between 1 and ${steps.length}.`);
    // Optionally render nothing or an error state
    return null;
  }

  return (
    // Adjust gaps for tighter layout
    <div role="list" className="flex flex-wrap md:flex-nowrap items-start w-full gap-x-1 gap-y-3 md:gap-x-2 justify-between mb-8 md:mb-12">
      {steps.map((step, index) => {
        const isCompleted = step.id <= currentStep;
        const isCurrent = step.id === currentStep;
        const status = isCompleted ? 'Completed' : 'Upcoming';

        return (
          <React.Fragment key={step.id}>
            {/* Step Item - Adjusted width/padding implicitly via parent gap */}
            <div
              role="listitem"
              aria-label={`Step ${step.id}: ${step.label} (${status})`}
              // Adjust flex properties if needed, added padding
              className="flex flex-col items-center text-center flex-shrink-0 md:flex-1 px-1" 
            >
              {/* Larger Icons */}
              <CheckCircleIcon 
                className={cn(
                  // Increase icon size
                  'h-8 w-8 md:h-10 md:w-10 mb-1', 
                  isCompleted ? 'text-green-600' : 'text-gray-300'
                )} 
              />
              {/* Larger Label */}
              <span
                className={cn(
                  // Increase label size and style
                  'text-sm md:text-base font-medium leading-tight mt-1', 
                  isCompleted ? 'text-gray-800' : 'text-gray-600',
                  isCurrent && 'font-semibold' // Keep current bold
                )}
              >
                {step.label}
              </span>
              {/* Add Description */}
              <span className="text-xs text-gray-500 mt-1 leading-snug"> 
                {step.description}
              </span>
            </div>

            {/* Connector Line - Adjust vertical alignment */}
            {index < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={cn(
                  // Adjust margin-top based on new icon/text size
                  'h-[2px] flex-1 mt-5', 
                  'hidden md:block', 
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FundingProgress;
