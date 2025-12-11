import * as React from 'react';
type Theme = 'light' | 'dark' | 'system';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}
export declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map