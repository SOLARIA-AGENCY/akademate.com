import * as React from 'react';
interface DeleteCourseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    nombreCurso: string;
    tieneConvocatorias: boolean;
    numeroConvocatorias?: number;
    isDeleting: boolean;
}
export declare function DeleteCourseDialog({ isOpen, onClose, onConfirm, nombreCurso, tieneConvocatorias, numeroConvocatorias, isDeleting, }: DeleteCourseDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=DeleteCourseDialog.d.ts.map