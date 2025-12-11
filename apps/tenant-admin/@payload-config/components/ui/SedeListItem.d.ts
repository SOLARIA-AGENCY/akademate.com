interface SedeListItemProps {
    sede: {
        id: string;
        nombre: string;
        direccion: string;
        telefono: string;
        email: string;
        horario: string;
        aulas: number;
        capacidad: number;
        cursosActivos: number;
        profesores: number;
        imagen: string;
        borderColor?: string;
    };
    onClick?: () => void;
    className?: string;
}
export declare function SedeListItem({ sede, onClick, className }: SedeListItemProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SedeListItem.d.ts.map