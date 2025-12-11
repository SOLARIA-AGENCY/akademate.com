import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CEP Comunicación - Admin',
  description: 'Sistema de gestión de contenidos',
}

/*
 * Root layout - minimal wrapper
 * Each route group handles its own <html>/<body> structure
 * This prevents conflicts between custom dashboard and Payload admin
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return children directly - let each route group define html/body
  return children
}
