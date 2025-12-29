import React from 'react'

export const Textarea = ({
  id,
  value,
  onChange,
  placeholder,
  rows,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={className}
    data-testid="textarea"
    {...props}
  />
)
