import React from 'react'

export const Progress = ({ value, className }: { value?: number; className?: string }) => (
  <div className={className} data-testid="progress" role="progressbar" aria-valuenow={value}>
    <div style={{ width: `${value}%` }} />
  </div>
)
