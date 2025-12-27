import React from 'react'

export const Tabs = ({ children, className, defaultValue }: { children?: React.ReactNode; className?: string; defaultValue?: string }) => (
  <div className={className} data-testid="tabs" data-default={defaultValue}>
    {children}
  </div>
)

export const TabsList = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="tabs-list" role="tablist">
    {children}
  </div>
)

export const TabsTrigger = ({ children, className, value }: { children?: React.ReactNode; className?: string; value: string }) => (
  <button className={className} data-testid="tabs-trigger" role="tab" data-value={value}>
    {children}
  </button>
)

export const TabsContent = ({ children, className, value }: { children?: React.ReactNode; className?: string; value: string }) => (
  <div className={className} data-testid="tabs-content" role="tabpanel" data-value={value}>
    {children}
  </div>
)
