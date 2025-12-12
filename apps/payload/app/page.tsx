import { redirect } from 'next/navigation'

// Redirect root to Payload admin
export default function RootPage() {
  redirect('/admin')
}
