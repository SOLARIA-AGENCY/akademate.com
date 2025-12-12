import * as React from 'react';
import { render as rtlRender } from '@testing-library/react';
// Mock Next.js router
export const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
};
vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => mockRouter.pathname,
    useSearchParams: () => new URLSearchParams(),
}));
// Custom render function
const customRender = (ui, options) => rtlRender(ui, { ...options });
export * from '@testing-library/react';
export { customRender as render };
export { React };
//# sourceMappingURL=test-utils.js.map