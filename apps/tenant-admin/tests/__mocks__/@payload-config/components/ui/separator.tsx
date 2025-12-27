import React from 'react'

export const Separator = ({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) => (
  <hr className={className} data-testid="separator" data-orientation={orientation} />
)
