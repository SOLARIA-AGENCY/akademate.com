import React from 'react'

export const Progress = ({ value, className }: { value?: number; className?: string }) => (
  <div
    className={className}
    data-testid="progress"
    role="progressbar"
    aria-valuenow={value}
    data-oid="1lb5du4"
  >
    <div style={{ width: `${value}%` }} data-oid="x13gfjs" />
  </div>
)
