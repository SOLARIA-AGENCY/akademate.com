import { LoginForm } from './_components/LoginForm'

export const metadata = {
  title: 'Login - Campus',
}

export default function CampusLoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <LoginForm />
    </main>
  )
}
