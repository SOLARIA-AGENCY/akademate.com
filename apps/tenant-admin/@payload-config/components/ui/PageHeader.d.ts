import * as React from 'react';
import { LucideIcon } from 'lucide-react';
interface PageHeaderProps {
    /** Page title */
    title: string;
    /** Page description/subtitle */
    description?: string;
    /** Icon component from lucide-react */
    icon?: LucideIcon;
    /** Show "New" button */
    showAddButton?: boolean;
    /** Text for add button (default: "Nuevo") */
    addButtonText?: string;
    /** Callback when add button is clicked */
    onAdd?: () => void;
    /** Additional actions (rendered in header row) */
    actions?: React.ReactNode;
    /** Filter controls (rendered in second row) */
    filters?: React.ReactNode;
    /** Badge or count to display next to title */
    badge?: React.ReactNode;
    /** Whether to use card wrapper (default: true) */
    withCard?: boolean;
    /** Additional className for outer wrapper */
    className?: string;
}
/**
 * Standardized page header component for all dashboard pages.
 *
 * Follows the Planner Visual design pattern:
 * - Card wrapper with shadow and border
 * - Two-row layout: Title/Actions + Filters
 * - Consistent spacing and typography
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Planner Visual"
 *   description="Calendario semanal de aulas y horarios"
 *   icon={Calendar}
 *   showAddButton
 *   addButtonText="Nueva Clase"
 *   onAdd={() => router.push('/planner/nuevo')}
 *   actions={
 *     <>
 *       <Button variant="outline" size="sm">
 *         <Download className="mr-2 h-4 w-4" />
 *         Exportar
 *       </Button>
 *     </>
 *   }
 *   filters={
 *     <div className="flex items-center gap-4">
 *       <Select>...</Select>
 *       <ViewToggle>...</ViewToggle>
 *     </div>
 *   }
 * />
 * ```
 */
export declare function PageHeader({ title, description, icon: Icon, showAddButton, addButtonText, onAdd, actions, filters, badge, withCard, className, }: PageHeaderProps): React.JSX.Element;
export {};
//# sourceMappingURL=PageHeader.d.ts.map