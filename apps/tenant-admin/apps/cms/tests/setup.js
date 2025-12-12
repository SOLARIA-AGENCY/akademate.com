import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
// Cleanup after each test
afterEach(() => {
    cleanup();
});
// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));
// Mock Next.js Image
vi.mock('next/image', () => ({
    default: (props) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return { ...props } /  >
        ;
    },
}));
// Mock Next.js Link
vi.mock('next/link', () => ({
    default: ({ children, href }) => {
        return href;
        {
            href;
        }
         > { children } < /a>;
    },
}));
//# sourceMappingURL=setup.js.map