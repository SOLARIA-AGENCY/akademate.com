export async function isAuthenticated() {
    if (typeof window === 'undefined')
        return false;
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        if (!response.ok)
            return false;
        const data = await response.json();
        return Boolean(data.authenticated && data.user);
    }
    catch {
        return false;
    }
}
export async function getUser() {
    if (typeof window === 'undefined')
        return null;
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        return data.user ?? null;
    }
    catch {
        return null;
    }
}
export async function logout() {
    if (typeof window === 'undefined')
        return;
    try {
        await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
    }
    catch (error) {
        console.error('Session logout failed:', error);
    }
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    }
    catch (error) {
        console.error('Server logout failed:', error);
    }
}
//# sourceMappingURL=auth.js.map
