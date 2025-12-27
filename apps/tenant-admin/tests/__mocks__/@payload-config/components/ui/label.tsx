import React from 'react'

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={className} data-testid="label" {...props}>
      {children}
    </label>
  )
)

Label.displayName = 'Label'
