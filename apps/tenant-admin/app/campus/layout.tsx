/**
 * Campus Virtual Layout
 *
 * Student-facing layout for the Learning Management System.
 * Includes SessionProvider and navigation.
 */

import { SessionProvider } from './providers/SessionProvider';
import { CampusNavbar } from './components/CampusNavbar';

export const metadata = {
  title: 'Campus Virtual | Akademate',
  description: 'Tu espacio de aprendizaje en linea',
};

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <CampusNavbar />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
