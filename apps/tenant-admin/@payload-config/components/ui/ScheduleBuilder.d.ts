import * as React from 'react';
export interface ScheduleEntry {
    day: string;
    startTime: string;
    endTime: string;
}
interface ScheduleBuilderProps {
    value: ScheduleEntry[];
    onChange: (schedule: ScheduleEntry[]) => void;
}
export declare function ScheduleBuilder({ value, onChange }: ScheduleBuilderProps): React.JSX.Element;
export {};
//# sourceMappingURL=ScheduleBuilder.d.ts.map