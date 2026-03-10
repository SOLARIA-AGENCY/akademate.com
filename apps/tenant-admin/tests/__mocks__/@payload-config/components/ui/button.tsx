import React from 'react'

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string
    size?: string
    asChild?: boolean
  }
>(({ children, className, variant, size, asChild, ...props }, ref) => (
  <button
    ref={ref}
    className={className}
    data-variant={variant}
    data-size={size}
    {...props}
    data-oid="x3eq1_h"
  >
    {children}
  </button>
))

Button.displayName = 'Button'

export const buttonVariants = () => ''
