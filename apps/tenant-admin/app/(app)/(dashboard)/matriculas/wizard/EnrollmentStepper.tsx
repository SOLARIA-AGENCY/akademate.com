'use client'

import { Check } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'
import { wizardStepTitle, type WizardStepId } from './types'

export function EnrollmentStepper({
  steps,
  current,
  completed,
  onSelect,
}: {
  steps: WizardStepId[]
  current: WizardStepId
  completed: Set<WizardStepId>
  onSelect: (step: WizardStepId) => void
}) {
  const currentIndex = steps.indexOf(current)
  const progress = steps.length > 1 ? Math.round((currentIndex / (steps.length - 1)) * 100) : 0

  return (
    <div className="min-w-0 space-y-3" data-slot="enrollment-stepper">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ol className="flex min-w-0 flex-wrap gap-2">
        {steps.map((step, index) => {
          const isCurrent = step === current
          const isDone = completed.has(step)
          const clickable = isDone || index <= currentIndex
          return (
            <li key={step}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect(step)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isDone && !isCurrent && 'border-primary/30 bg-primary/10 text-primary',
                  !isCurrent && !isDone && 'border-border bg-card text-muted-foreground',
                  !clickable && 'cursor-not-allowed opacity-60'
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-[11px]">
                  {isDone && !isCurrent ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{wizardStepTitle(step)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
