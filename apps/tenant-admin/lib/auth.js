export function isAuthenticated() {
    if (typeof window === 'undefined')
        return false;
    // Check for user metadata (non-sensitive). The actual auth token is stored
    // in an httpOnly cookie and validated server-side by the middleware.
    return !!localStorage.getItem('cep_user');
}
export function getUser() {
    if (typeof window === 'undefined')
        return null;
    const userStr = localStorage.getItem('cep_user');
    if (!userStr)
        return null;
    try {
        return JSON.parse(userStr);
    }
    catch {
        return null;
    }
}
export async function logout() {
    if (typeof window === 'undefined')
        return;
    // Clear the httpOnly auth cookie via server-side endpoint
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    }
    catch (error) {
        console.error('Server logout failed:', error);
    }
    // Clear non-sensitive user metadata from localStorage
    localStorage.removeItem('cep_user');
}
//# sourceMappingURL=auth.js.map