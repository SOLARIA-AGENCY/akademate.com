import { ReactNode } from 'react';
interface MockupTableProps {
    title: string;
    description?: string;
    columns: string[];
    rows: ReactNode[][];
    onAdd?: () => void;
    addButtonText?: string;
    onExport?: () => void;
}
export declare function MockupTable({ title, description, columns, rows, onAdd, addButtonText, onExport, }: MockupTableProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=MockupTable.d.ts.map