import React from 'react';
import { Check } from 'lucide-react';

export type WizardStep = 'trip' | 'style' | 'results';

interface StepperProps {
  activeStep: WizardStep;
  canNavigateToStyle?: boolean;
  canNavigateToResults?: boolean;
  onSelectStep?: (step: WizardStep) => void;
}

const STEPS: { id: WizardStep; number: string; label: string }[] = [
  { id: 'trip', number: '1', label: 'Trip details' },
  { id: 'style', number: '2', label: 'Activities & bag' },
  { id: 'results', number: '3', label: 'Packing list' },
];

export const Stepper: React.FC<StepperProps> = ({
  activeStep,
  canNavigateToStyle = false,
  canNavigateToResults = false,
  onSelectStep,
}) => {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  const isStepClickable = (stepId: WizardStep, index: number) => {
    if (!onSelectStep || stepId === activeStep) return false;
    if (stepId === 'trip') return true;
    if (stepId === 'style') return canNavigateToStyle || index < activeIndex;
    if (stepId === 'results') return canNavigateToResults;
    return false;
  };

  return (
    <nav aria-label="Trip planning steps" className="no-print py-4">
      <ol className="flex items-center justify-between sm:justify-start sm:gap-4 max-w-2xl">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const clickable = isStepClickable(step.id, idx);

          return (
            <React.Fragment key={step.id}>
              <li className="flex items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onSelectStep?.(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`group flex items-center gap-2.5 min-h-11 px-2 rounded-lg text-left transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] ${
                    clickable ? 'cursor-pointer hover:bg-[#EFECE4]' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-colors shrink-0 ${
                      isCurrent
                        ? 'bg-[#1F4D3A] text-white ring-4 ring-[#1F4D3A]/15'
                        : isCompleted
                        ? 'bg-[#D9734E] text-white'
                        : 'bg-[#EFECE4] text-[#5A655E] border border-[#E2DDD3]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : step.number}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-[#1C2420] font-semibold'
                        : isCompleted
                        ? 'text-[#1F4D3A]'
                        : 'text-[#5A655E]'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </li>

              {idx < STEPS.length - 1 && (
                <li aria-hidden="true" className="flex-1 sm:flex-none sm:w-10 mx-1">
                  <div
                    className={`h-px w-full ${
                      idx < activeIndex ? 'bg-[#D9734E]' : 'bg-[#E2DDD3]'
                    }`}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
