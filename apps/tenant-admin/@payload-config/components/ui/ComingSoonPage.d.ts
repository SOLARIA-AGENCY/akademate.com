import * as React from 'react';
import { LucideIcon } from 'lucide-react';
interface ComingSoonPageProps {
    /** Page title */
    title: string;
    /** Page description */
    description?: string;
    /** Icon for the page header */
    icon?: LucideIcon;
    /** Expected implementation phase or date */
    expectedPhase?: string;
    /** List of planned features */
    plannedFeatures?: string[];
    /** Additional note to display */
    note?: string;
}
/**
 * Standardized "Coming Soon" page for modules not yet implemented.
 *
 * Shows a consistent layout with:
 * - Page header with icon
 * - Construction indicator
 * - Planned features list
 * - Expected timeline
 *
 * @example
 * ```tsx
 * <ComingSoonPage
 *   title="Creatividades"
 *   description="Gestión de creatividades para campañas de marketing"
 *   icon={Sparkles}
 *   expectedPhase="Fase F6"
 *   plannedFeatures={[
 *     "Generación automática con IA",
 *     "Templates predefinidos",
 *     "Preview en tiempo real",
 *   ]}
 * />
 * ```
 */
export declare function ComingSoonPage({ title, description, icon, expectedPhase, plannedFeatures, note, }: ComingSoonPageProps): React.JSX.Element;
export {};
//# sourceMappingURL=ComingSoonPage.d.ts.map