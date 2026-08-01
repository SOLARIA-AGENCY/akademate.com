import * as React from 'react'

import { cn } from '../lib/cn'

export const Progress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: number }>(
  ({ className, value = 0, ...props }, ref) => {
    const boundedValue = Math.max(0, Math.min(100, value))
    return <div ref={ref} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedValue} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)} {...props}><div className="h-full bg-primary transition-[width] duration-300 ease-in-out" style={{ width: `${boundedValue}%` }} /></div>
  },
)
Progress.displayName = 'Progress'
