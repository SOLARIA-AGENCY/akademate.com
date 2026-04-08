/**
 * Campus Virtual Layout
 *
 * Student-facing layout for the Learning Management System.
 * Includes SessionProvider and navigation.
 */

import { SessionProvider } from './providers/SessionProvider'
import { CampusNavbar } from './components/CampusNavbar'

export const metadata = {
  title: 'Campus Virtual',
  description: 'Tu espacio de aprendizaje en linea',
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider data-oid="1ais:ia">
      <div className="min-h-screen bg-background" data-oid="0ds5yet">
        <CampusNavbar data-oid="kjte.3v" />
        <main className="container mx-auto px-4 py-6" data-oid="0ht6r9q">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
