'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@payload-config/components/ui/button';
import { LogOut } from 'lucide-react';
export function LogoutButton() {
    const router = useRouter();
    const handleLogout = async () => {
        // Clear the httpOnly auth cookie via server-side endpoint
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        }
        catch (error) {
            console.error('Server logout failed:', error);
        }
        // Clear non-sensitive user metadata from localStorage
        localStorage.removeItem('cep_user');
        // Redirect to login
        router.push('/auth/login');
    };
    return (<Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
      <LogOut className="mr-2 h-4 w-4"/>
      Cerrar Sesión
    </Button>);
}
//# sourceMappingURL=LogoutButton.js.map