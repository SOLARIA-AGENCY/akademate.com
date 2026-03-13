import { redirect } from 'next/navigation'

// Gastos detail redirects to parent P&L page which already has the full table
export default function GastosPage() {
  redirect('/dashboard/finanzas')
}
