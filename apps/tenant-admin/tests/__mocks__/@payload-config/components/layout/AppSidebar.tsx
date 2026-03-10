import React from 'react'

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside data-testid="app-sidebar" data-oid="oswmfe2">
      {children}
    </aside>
  )
}

export default AppSidebar
