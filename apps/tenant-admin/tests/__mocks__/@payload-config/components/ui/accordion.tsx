import React from 'react'

export const Accordion = ({ children, className, type, collapsible }: { children?: React.ReactNode; className?: string; type?: string; collapsible?: boolean }) => (
  <div className={className} data-testid="accordion" data-type={type}>
    {children}
  </div>
)

export const AccordionItem = ({ children, className, value }: { children?: React.ReactNode; className?: string; value: string }) => (
  <div className={className} data-testid="accordion-item" data-value={value}>
    {children}
  </div>
)

export const AccordionTrigger = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <button className={className} data-testid="accordion-trigger">
    {children}
  </button>
)

export const AccordionContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="accordion-content">
    {children}
  </div>
)
