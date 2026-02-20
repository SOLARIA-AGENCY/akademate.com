import { LoginForm } from '../_components/LoginForm'

export const metadata = {
  title: 'Login - Campus',
}

export default function CampusLoginAliasPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  )
}
