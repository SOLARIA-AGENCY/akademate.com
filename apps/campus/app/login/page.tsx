import { LoginForm } from '../_components/LoginForm'

export const metadata = {
  title: 'Login - Campus',
}

export default function CampusLoginAliasPage() {
  return (
    <main className="min-h-screen bg-background py-10">
      <LoginForm />
    </main>
  )
}
