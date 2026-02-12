import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { LogoutButton } from '@payload-config/components/ui/LogoutButton';
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));
// Mock fetch for server-side logout call
global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));
describe('LogoutButton Component', () => {
    const mockPush = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
        global.fetch.mockClear();
        localStorage.clear();
    });
    it('renders logout button correctly', () => {
        render(<LogoutButton />);
        expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });
    it('calls server logout, clears user metadata, and redirects on click', async () => {
        localStorage.setItem('cep_user', '{}');
        render(<LogoutButton />);
        const logoutButton = screen.getByText('Cerrar Sesión');
        fireEvent.click(logoutButton);
        await waitFor(() => {
            // Should call server endpoint to clear httpOnly cookie
            expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST', credentials: 'include' }));
            // Should clear user metadata from localStorage
            expect(localStorage.getItem('cep_user')).toBeNull();
            expect(mockPush).toHaveBeenCalledWith('/auth/login');
        });
    });
    it('has logout icon', () => {
        render(<LogoutButton />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-full', 'justify-start');
    });
});
//# sourceMappingURL=LogoutButton.test.js.map