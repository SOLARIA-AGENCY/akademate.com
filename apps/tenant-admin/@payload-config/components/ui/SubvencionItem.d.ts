import * as React from 'react';
import type { Subvencion } from '@/types';
interface SubvencionItemProps {
    subvencion: Subvencion;
    onUpdate: (subvencion: Subvencion) => void;
    onRemove: () => void;
}
export declare function SubvencionItem({ subvencion, onUpdate, onRemove }: SubvencionItemProps): React.JSX.Element;
export {};
//# sourceMappingURL=SubvencionItem.d.ts.map