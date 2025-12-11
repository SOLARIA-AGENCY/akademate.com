import * as React from 'react';
import type { PlantillaCurso, CourseModality, ConvocationStatus } from '@/types';
import { type ScheduleEntry } from '@payload-config/components/ui/ScheduleBuilder';
interface ConvocationGeneratorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseTemplate: PlantillaCurso;
    onSubmit: (data: ConvocationFormData) => void;
}
export interface ConvocationFormData {
    fechaInicio: string;
    fechaFin: string;
    horario: ScheduleEntry[];
    modalidad: CourseModality;
    estado: ConvocationStatus;
    plazasTotales: number;
    precio: number;
    profesorId: string;
    sedeId: string;
    aulaId: string;
}
export declare function ConvocationGeneratorModal({ open, onOpenChange, courseTemplate, onSubmit, }: ConvocationGeneratorModalProps): React.JSX.Element;
export {};
//# sourceMappingURL=ConvocationGeneratorModal.d.ts.map