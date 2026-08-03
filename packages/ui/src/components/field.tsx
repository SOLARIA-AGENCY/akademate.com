import * as React from 'react'

import { cn } from '../lib/cn'

export const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.ComponentProps<'fieldset'>
>(({ className, ...props }, ref) => (
  <fieldset ref={ref} className={cn('flex min-w-0 flex-col gap-4', className)} {...props} />
))
FieldSet.displayName = 'FieldSet'

export const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }
>(({ className, variant = 'legend', ...props }, ref) => (
  <legend
    ref={ref}
    className={cn(
      variant === 'legend' ? 'text-base font-semibold' : 'text-sm font-medium',
      'text-foreground',
      className,
    )}
    {...props}
  />
))
FieldLegend.displayName = 'FieldLegend'

export const FieldGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-6', className)} {...props} />
  ),
)
FieldGroup.displayName = 'FieldGroup'

export const Field = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' }
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-orientation={orientation}
    className={cn(
      'group/field flex gap-2 data-[invalid=true]:text-destructive',
      orientation === 'vertical' && 'flex-col',
      orientation === 'horizontal' && 'items-center justify-between',
      orientation === 'responsive' && 'flex-col md:flex-row md:items-start md:justify-between',
      className,
    )}
    {...props}
  />
))
Field.displayName = 'Field'

export const FieldContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...props} />
  ),
)
FieldContent.displayName = 'FieldContent'

export const FieldLabel = React.forwardRef<HTMLLabelElement, React.ComponentProps<'label'>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2 text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
FieldLabel.displayName = 'FieldLabel'

export const FieldTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm font-medium text-foreground', className)} {...props} />
  ),
)
FieldTitle.displayName = 'FieldTitle'

export const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<'p'>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm leading-5 text-muted-foreground', className)} {...props} />
))
FieldDescription.displayName = 'FieldDescription'

export const FieldError = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      role="alert"
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    />
  ),
)
FieldError.displayName = 'FieldError'
