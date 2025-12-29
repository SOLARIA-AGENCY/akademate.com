import React from 'react'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-id="skeleton" className={className} {...props} />
}
