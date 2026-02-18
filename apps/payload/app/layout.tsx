// Required root layout for Next.js App Router
// Payload's (payload) route group handles its own HTML structure via @payloadcms/next/layouts RootLayout
// This layout MUST NOT include <html> or <body> tags - Payload generates those
// globals.css is imported by (payload)/layout.tsx, not here
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
