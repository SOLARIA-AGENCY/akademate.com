import { isAuthenticated, getUser, logout } from '@/lib/auth';
// Mock fetch for server-side logout call
global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));
describe('Auth Helpers', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch.mockClear();
    });
    describe('isAuthenticated', () => {
        it('returns false when no user data exists', () => {
            expect(isAuthenticated()).toBe(false);
        });
        it('returns true when user metadata exists in localStorage', () => {
            localStorage.setItem('cep_user', JSON.stringify({ id: 1, name: 'Test' }));
            expect(isAuthenticated()).toBe(true);
        });
    });
    describe('getUser', () => {
        it('returns null when no user data exists', () => {
            expect(getUser()).toBeNull();
        });
        it('returns user object when data exists', () => {
            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@test.com',
                role: 'Admin'
            };
            localStorage.setItem('cep_user', JSON.stringify(mockUser));
            expect(getUser()).toEqual(mockUser);
        });
        it('returns null when user data is invalid JSON', () => {
            localStorage.setItem('cep_user', 'invalid json');
            expect(getUser()).toBeNull();
        });
    });
    describe('logout', () => {
        it('calls server logout endpoint and clears user metadata', async () => {
            localStorage.setItem('cep_user', '{}');
            await logout();
            // Should call server endpoint to clear httpOnly cookie
            expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST', credentials: 'include' }));
            // Should clear user metadata from localStorage
            expect(localStorage.getItem('cep_user')).toBeNull();
        });
    });
});
//# sourceMappingURL=auth.test.js.map