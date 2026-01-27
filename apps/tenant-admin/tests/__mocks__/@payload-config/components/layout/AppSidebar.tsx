import React from 'react'

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside data-testid="app-sidebar">
      {children}
    </aside>
  )
}

export default AppSidebar
