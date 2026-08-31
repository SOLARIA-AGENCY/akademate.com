'use client'

import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { Label } from '@payload-config/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@payload-config/components/ui/tooltip'

export function FormPage({
  header,
  children,
}: {
  header: ReactNode
  children: ReactNode
}) {
  return (
    <div data-slot="form-page" className="flex min-h-0 flex-col">
      <div
        data-slot="form-page-header"
        className="sticky top-0 z-20 bg-background/95 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        {header}
      </div>
      <div data-slot="form-page-body" className="min-w-0">
        {children}
      </div>
    </div>
  )
}

export function FieldLabel({
  htmlFor,
  children,
  required = false,
  hint,
}: {
  htmlFor?: string
  children: ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>
        {children}
        {required ? ' *' : null}
      </Label>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex text-muted-foreground hover:text-foreground"
              aria-label="Ayuda"
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{hint}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
