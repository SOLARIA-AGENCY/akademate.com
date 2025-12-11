/*
 * Passthrough layout for Payload admin route group
 * Payload's own RootLayout handles <html> and <body>
 */
import React from 'react'

export default function PayloadRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
