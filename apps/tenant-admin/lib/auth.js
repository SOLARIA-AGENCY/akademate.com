export function isAuthenticated() {
    if (typeof window === 'undefined')
        return false;
    return !!localStorage.getItem('cep_auth_token');
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
export function logout() {
    if (typeof window === 'undefined')
        return;
    localStorage.removeItem('cep_auth_token');
    localStorage.removeItem('cep_user');
}
//# sourceMappingURL=auth.js.map