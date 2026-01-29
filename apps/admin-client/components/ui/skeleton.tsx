/* eslint-disable @typescript-eslint/no-unsafe-call */
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('bg-muted animate-pulse rounded-md', className) as string} {...props} />
}

export { Skeleton }
