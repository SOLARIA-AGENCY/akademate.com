import React from 'react'

export function AssignEmptyButton({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <a href={href} data-testid="assign-empty">
      {label}
    </a>
  )
}
