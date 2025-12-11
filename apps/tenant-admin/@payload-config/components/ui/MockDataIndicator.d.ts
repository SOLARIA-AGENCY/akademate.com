interface MockDataIndicatorProps {
    /** Label to display (e.g., "Datos simulados", "Pendiente conexión API") */
    label?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show as badge inline or as overlay */
    variant?: 'badge' | 'overlay' | 'banner';
    /** Additional CSS classes */
    className?: string;
}
/**
 * Visual indicator for mock/placeholder data
 * Use this to clearly mark sections that are not yet connected to real APIs
 *
 * @example
 * // Badge on a card
 * <MockDataIndicator size="sm" />
 *
 * // Overlay on a chart
 * <MockDataIndicator variant="overlay" label="Gráfico de demostración" />
 *
 * // Banner at top of section
 * <MockDataIndicator variant="banner" label="Esta sección usa datos de prueba" />
 */
export declare function MockDataIndicator({ label, size, variant, className }: MockDataIndicatorProps): import("react").JSX.Element;
/**
 * HOC wrapper to add mock data indicator to any component
 */
export declare function withMockIndicator<P extends object>(WrappedComponent: React.ComponentType<P>, indicatorProps?: MockDataIndicatorProps): (props: P) => import("react").JSX.Element;
/**
 * Card wrapper with mock data styling (grayed out)
 */
export declare function MockDataCard({ children, title, label, className }: {
    children: React.ReactNode;
    title?: string;
    label?: string;
    className?: string;
}): import("react").JSX.Element;
export default MockDataIndicator;
//# sourceMappingURL=MockDataIndicator.d.ts.map