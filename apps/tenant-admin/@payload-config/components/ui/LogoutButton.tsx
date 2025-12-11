'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@payload-config/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('cep_auth_token')
    localStorage.removeItem('cep_user')
    
    // Redirect to login
    router.push('/auth/login')
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Cerrar Sesión
    </Button>
  )
}
