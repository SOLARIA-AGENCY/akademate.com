/**
 * Course Type Configuration
 *
 * Centralizes the color-coding system for CEP course types.
 * Color system follows the reference implementation from the main app.
 *
 * COLOR MAPPING:
 * - PRIVADOS: RED (bg-red-600) - Private paid courses
 * - OCUPADOS: GREEN (bg-green-600) - Employed workers (100% subsidized)
 * - DESEMPLEADOS: BLUE (bg-blue-600) - Unemployed workers (free)
 * - TELEFORMACIÓN: ORANGE (bg-orange-600) - Online/remote courses
 * - CICLO MEDIO: PINK/RED (bg-red-500) - Mid-level vocational training
 * - CICLO SUPERIOR: RED (bg-red-600) - Advanced vocational training
 */
export declare const COURSE_TYPE_CONFIG: {
    readonly privados: {
        readonly label: "PRIVADO";
        readonly bgColor: "bg-red-600";
        readonly hoverColor: "hover:bg-red-700";
        readonly textColor: "text-red-600";
        readonly borderColor: "border-red-600";
        readonly dotColor: "bg-red-600";
    };
    readonly ocupados: {
        readonly label: "OCUPADOS";
        readonly bgColor: "bg-green-600";
        readonly hoverColor: "hover:bg-green-700";
        readonly textColor: "text-green-600";
        readonly borderColor: "border-green-600";
        readonly dotColor: "bg-green-600";
    };
    readonly desempleados: {
        readonly label: "DESEMPLEADOS";
        readonly bgColor: "bg-blue-600";
        readonly hoverColor: "hover:bg-blue-700";
        readonly textColor: "text-blue-600";
        readonly borderColor: "border-blue-600";
        readonly dotColor: "bg-blue-600";
    };
    readonly teleformacion: {
        readonly label: "TELEFORMACIÓN";
        readonly bgColor: "bg-orange-600";
        readonly hoverColor: "hover:bg-orange-700";
        readonly textColor: "text-orange-600";
        readonly borderColor: "border-orange-600";
        readonly dotColor: "bg-orange-600";
    };
    readonly 'ciclo-medio': {
        readonly label: "CICLO MEDIO";
        readonly bgColor: "bg-red-500";
        readonly hoverColor: "hover:bg-red-600";
        readonly textColor: "text-red-500";
        readonly borderColor: "border-red-500";
        readonly dotColor: "bg-red-500";
    };
    readonly 'ciclo-superior': {
        readonly label: "CICLO SUPERIOR";
        readonly bgColor: "bg-red-600";
        readonly hoverColor: "hover:bg-red-700";
        readonly textColor: "text-red-600";
        readonly borderColor: "border-red-600";
        readonly dotColor: "bg-red-600";
    };
};
export type CourseTypeKey = keyof typeof COURSE_TYPE_CONFIG;
/**
 * Get type configuration for a given course type
 * @param type - The course type
 * @returns Configuration object with colors and labels
 */
export declare function getCourseTypeConfig(type: CourseTypeKey): {
    readonly label: "PRIVADO";
    readonly bgColor: "bg-red-600";
    readonly hoverColor: "hover:bg-red-700";
    readonly textColor: "text-red-600";
    readonly borderColor: "border-red-600";
    readonly dotColor: "bg-red-600";
} | {
    readonly label: "OCUPADOS";
    readonly bgColor: "bg-green-600";
    readonly hoverColor: "hover:bg-green-700";
    readonly textColor: "text-green-600";
    readonly borderColor: "border-green-600";
    readonly dotColor: "bg-green-600";
} | {
    readonly label: "DESEMPLEADOS";
    readonly bgColor: "bg-blue-600";
    readonly hoverColor: "hover:bg-blue-700";
    readonly textColor: "text-blue-600";
    readonly borderColor: "border-blue-600";
    readonly dotColor: "bg-blue-600";
} | {
    readonly label: "TELEFORMACIÓN";
    readonly bgColor: "bg-orange-600";
    readonly hoverColor: "hover:bg-orange-700";
    readonly textColor: "text-orange-600";
    readonly borderColor: "border-orange-600";
    readonly dotColor: "bg-orange-600";
} | {
    readonly label: "CICLO MEDIO";
    readonly bgColor: "bg-red-500";
    readonly hoverColor: "hover:bg-red-600";
    readonly textColor: "text-red-500";
    readonly borderColor: "border-red-500";
    readonly dotColor: "bg-red-500";
} | {
    readonly label: "CICLO SUPERIOR";
    readonly bgColor: "bg-red-600";
    readonly hoverColor: "hover:bg-red-700";
    readonly textColor: "text-red-600";
    readonly borderColor: "border-red-600";
    readonly dotColor: "bg-red-600";
};
/**
 * Get all available course types as array
 */
export declare function getAllCourseTypes(): CourseTypeKey[];
//# sourceMappingURL=courseTypeConfig.d.ts.map