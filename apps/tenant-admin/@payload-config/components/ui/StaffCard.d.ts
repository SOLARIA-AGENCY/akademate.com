import * as React from 'react';
interface StaffCardProps {
    id: number;
    fullName: string;
    position: string;
    contractType: string;
    employmentStatus: string;
    photo: string;
    email: string;
    phone: string;
    bio?: string;
    assignedCampuses: Array<{
        id: number;
        name: string;
        city: string;
    }>;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number, name: string) => void;
}
export declare function StaffCard({ id, fullName, position, contractType, employmentStatus, photo, email, phone, bio, assignedCampuses, onView, onEdit, onDelete, }: StaffCardProps): React.JSX.Element;
export {};
//# sourceMappingURL=StaffCard.d.ts.map