import * as React from 'react';
import type { EntidadFinanciadoraKey } from '@/types';
interface EntidadSelectorProps {
    onSelect: (entidad: EntidadFinanciadoraKey) => void;
    excluidas?: EntidadFinanciadoraKey[];
    entidadesUsadas?: EntidadFinanciadoraKey[];
}
export declare function EntidadSelector({ onSelect, excluidas, entidadesUsadas }: EntidadSelectorProps): React.JSX.Element;
export {};
//# sourceMappingURL=EntidadSelector.d.ts.map