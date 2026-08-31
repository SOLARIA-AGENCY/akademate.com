'use client'

import { Check } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Progress } from '@payload-config/components/ui/progress'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'
import { WIZARD_STAGES, wizardStageTitle, type WizardStageId } from './types'

export function EnrollmentStepper({
  current,
  completed,
  onSelect,
}: {
  current: WizardStageId
  completed: Set<WizardStageId>
  onSelect: (stage: WizardStageId) => void
}) {
  const currentIndex = WIZARD_STAGES.findIndex((stage) => stage.id === current)
  const progress = currentIndex <= 0 ? 0 : Math.round((currentIndex / (WIZARD_STAGES.length - 1)) * 100)

  return (
    <div className="min-w-0 space-y-3" data-slot="enrollment-stepper">
      <Progress value={progress} className="h-1.5" />
      <ol className="flex min-w-0 items-center gap-1 sm:gap-2">
        {WIZARD_STAGES.map((stage, index) => {
          const isCurrent = stage.id === current
          const isDone = completed.has(stage.id)
          const clickable = isDone || index <= currentIndex
          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant={isCurrent ? 'default' : isDone ? 'secondary' : 'outline'}
                disabled={!clickable}
                onClick={() => clickable && onSelect(stage.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn('min-w-0 flex-1 justify-start', !clickable && 'opacity-60')}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/20 text-[11px]">
                  {isDone && !isCurrent ? <Check className="h-3 w-3" /> : stage.id}
                </span>
                <span className="hidden truncate sm:inline">{wizardStageTitle(stage.id)}</span>
              </Button>
              {index < WIZARD_STAGES.length - 1 ? (
                <Separator
                  className={cn('hidden h-px flex-1 sm:block', isDone || isCurrent ? 'bg-primary' : 'bg-border')}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
