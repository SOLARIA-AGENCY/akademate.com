/**
 * Campus Virtual Layout
 *
 * Student-facing layout for the Learning Management System.
 */

import { SessionProvider } from './providers/SessionProvider'
import { CampusShell } from './components/CampusShell'

export const metadata = {
  title: 'Campus Virtual',
  description: 'Tu espacio de aprendizaje en linea',
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CampusShell>{children}</CampusShell>
    </SessionProvider>
  )
}
