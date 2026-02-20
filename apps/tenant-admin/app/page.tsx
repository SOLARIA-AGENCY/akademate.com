import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasSession = Boolean(cookieStore.get('payload-token')?.value || cookieStore.get('cep_session')?.value)
  redirect(hasSession ? '/dashboard' : '/auth/login')
}
