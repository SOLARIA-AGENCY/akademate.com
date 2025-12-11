export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}
export declare function isAuthenticated(): boolean;
export declare function getUser(): User | null;
export declare function logout(): void;
//# sourceMappingURL=auth.d.ts.map