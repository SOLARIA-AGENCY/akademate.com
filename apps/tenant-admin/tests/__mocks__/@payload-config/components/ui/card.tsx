import React from 'react'

export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} data-testid="card" {...props} data-oid="e2n8sjk">
    {children}
  </div>
)

export const CardHeader = ({
  children,
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    data-testid="card-header"
    onClick={onClick}
    {...props}
    data-oid="-0hlyts"
  >
    {children}
  </div>
)

export const CardTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <h3 className={className} data-testid="card-title" data-oid="i5re6_-">
    {children}
  </h3>
)

export const CardDescription = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <p className={className} data-testid="card-description" data-oid="v91lg9f">
    {children}
  </p>
)

export const CardContent = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="card-content" data-oid="fcs7olq">
    {children}
  </div>
)

export const CardFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="card-footer" data-oid="_nq6ckx">
    {children}
  </div>
)
