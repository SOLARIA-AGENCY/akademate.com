interface TeacherExpanded {
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    email: string;
    phone: string;
    photo: string;
    department: string;
    specialties: string[];
    bio: string;
    active: boolean;
    courses_count: number;
    certifications: Array<{
        title: string;
        institution: string;
        year: number;
    }>;
}
interface PersonalListItemProps {
    teacher: TeacherExpanded;
    onClick?: () => void;
    className?: string;
}
export declare function PersonalListItem({ teacher, onClick, className }: PersonalListItemProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PersonalListItem.d.ts.map