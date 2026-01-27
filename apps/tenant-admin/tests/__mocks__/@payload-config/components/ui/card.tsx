import React from 'react'

export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} data-testid="card" {...props}>{children}</div>
)

export const CardHeader = ({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} data-testid="card-header" onClick={onClick} {...props}>{children}</div>
)

export const CardTitle = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <h3 className={className} data-testid="card-title">{children}</h3>
)

export const CardDescription = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <p className={className} data-testid="card-description">{children}</p>
)

export const CardContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="card-content">{children}</div>
)

export const CardFooter = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="card-footer">{children}</div>
)
