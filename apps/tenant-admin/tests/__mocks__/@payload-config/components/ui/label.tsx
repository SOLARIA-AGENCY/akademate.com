import React from 'react'

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => (
  <label ref={ref} className={className} data-testid="label" {...props} data-oid="tk97lpt">
    {children}
  </label>
))

Label.displayName = 'Label'
