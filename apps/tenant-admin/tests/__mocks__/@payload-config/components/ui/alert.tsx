import React from 'react'

export const Alert = ({ children, className, variant }: { children?: React.ReactNode; className?: string; variant?: string }) => (
  <div className={className} data-testid="alert" role="alert" data-variant={variant}>
    {children}
  </div>
)

export const AlertTitle = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <h5 className={className} data-testid="alert-title">{children}</h5>
)

export const AlertDescription = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <p className={className} data-testid="alert-description">{children}</p>
)
