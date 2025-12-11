export interface Aula {
    id: string;
    nombre: string;
    codigo: string;
    sede: string;
    capacidad: number;
}
export interface HorarioDetallado {
    aula_id: string;
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
    hora_inicio: string;
    hora_fin: string;
    curso_nombre: string;
    profesor: string;
    color?: string;
}
export declare const aulasMockData: Aula[];
export declare const horariosDetalladosMock: HorarioDetallado[];
//# sourceMappingURL=mockAulas.d.ts.map