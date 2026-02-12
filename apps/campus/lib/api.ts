/**
 * API Client for Campus app
 * Fetches data from tenant-admin LMS endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009';

export interface ProgressData {
    enrollmentId: string;
    userId: string;
    courseRunId: string;
    status: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    totalTimeSpentMinutes: number;
    lastAccessAt: string | null;
    lessonProgress: any[];
}

export interface ModuleData {
    id: string;
    title: string;
    slug: string;
    description?: string;
    order: number;
    duration?: number;
    isPublished: boolean;
}

export interface LessonData {
    id: string;
    title: string;
    slug: string;
    type: 'text' | 'video' | 'quiz' | 'assignment' | 'live_session';
    content?: any;
    videoUrl?: string;
    duration?: number;
    order: number;
    isPublished: boolean;
    isFree: boolean;
}

export interface ContentData {
    courseId?: string;
    moduleId?: string;
    modules?: ModuleData[];
    lessons?: LessonData[];
    materials?: any[];
    totalModules?: number;
    totalLessons?: number;
    totalMaterials?: number;
}

export interface GamificationData {
    userId: string;
    badges: any[];
    totalBadges: number;
    totalPoints: number;
    recentTransactions: any[];
    streak: {
        currentStreak: number;
        longestStreak: number;
        lastActivityAt?: string;
    };
}

/**
 * Fetch progress for an enrollment
 */
export async function fetchProgress(enrollmentId: string): Promise<ProgressData> {
    const res = await fetch(`${API_BASE}/api/lms/progress?enrollmentId=${enrollmentId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(data: {
    enrollmentId: string;
    lessonId: string;
    isCompleted?: boolean;
    timeSpent?: number;
    lastPosition?: number;
}): Promise<any> {
    const res = await fetch(`${API_BASE}/api/lms/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Fetch modules for a course
 */
export async function fetchModules(courseId: string): Promise<ContentData> {
    const res = await fetch(`${API_BASE}/api/lms/content?courseId=${courseId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Fetch lessons for a module
 */
export async function fetchLessons(moduleId: string): Promise<ContentData> {
    const res = await fetch(`${API_BASE}/api/lms/content?moduleId=${moduleId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Fetch gamification data for a user
 */
export async function fetchGamification(userId: string): Promise<GamificationData> {
    const res = await fetch(`${API_BASE}/api/lms/gamification?userId=${userId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

// ============================================================================
// ENROLLMENT API
// ============================================================================

export interface EnrollmentData {
    id: string;
    status: 'active' | 'completed' | 'cancelled';
    enrolledAt: string;
    courseRun: {
        id: string;
        title: string;
        course: {
            id: string;
            title: string;
            thumbnail?: string;
        } | null;
    } | null;
    progress: {
        completed: number;
        total: number;
        percent: number;
    };
}

export interface EnrollmentDetailData {
    enrollment: {
        id: string;
        status: string;
        enrolledAt: string;
        startedAt?: string;
        completedAt?: string;
    };
    course: {
        id: string;
        title: string;
        slug: string;
        description?: string;
        thumbnail?: string;
    } | null;
    courseRun: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        status: string;
    } | null;
    modules: Array<{
        id: string;
        title: string;
        description?: string;
        order: number;
        estimatedMinutes?: number;
        lessons: Array<{
            id: string;
            title: string;
            description?: string;
            order: number;
            estimatedMinutes?: number;
            isMandatory: boolean;
            progress: {
                status: string;
                progressPercent: number;
            };
        }>;
        lessonsCount: number;
    }>;
    progress: {
        totalModules: number;
        totalLessons: number;
        completedLessons: number;
        progressPercent: number;
        status: string;
    };
}

/**
 * Fetch all enrollments for a user
 */
export async function fetchEnrollments(options?: {
    userId?: string;
    status?: 'active' | 'completed' | 'cancelled';
    limit?: number;
    page?: number;
}): Promise<{ data: EnrollmentData[]; meta: any }> {
    const params = new URLSearchParams();
    if (options?.userId) params.set('userId', options.userId);
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.page) params.set('page', String(options.page));

    const res = await fetch(`${API_BASE}/api/lms/enrollments?${params}`, {
        credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return { data: json.data, meta: json.meta };
}

/**
 * Fetch enrollment details with course content
 */
export async function fetchEnrollmentDetail(enrollmentId: string): Promise<EnrollmentDetailData> {
    const res = await fetch(`${API_BASE}/api/lms/enrollments/${enrollmentId}`, {
        credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Fetch module details with lessons and materials
 */
export async function fetchModuleDetail(moduleId: string, enrollmentId?: string): Promise<any> {
    const params = enrollmentId ? `?enrollmentId=${enrollmentId}` : '';
    const res = await fetch(`${API_BASE}/api/lms/modules/${moduleId}${params}`, {
        credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

// ============================================================================
// CERTIFICATES API (Payload REST)
// ============================================================================

export interface CertificateData {
    id: string;
    certificate_number: string;
    issued_at: string;
    expires_at?: string;
    verification_code: string;
    pdf_url?: string;
    pdf_file?: { url: string } | null;
    final_grade?: number;
    completion_hours?: number;
    course_run: {
        id: string;
        title: string;
    } | string | null;
    user: { id: string } | string;
}

export interface CertificatesResponse {
    docs: CertificateData[];
    totalDocs: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Fetch certificates for the authenticated user.
 * Uses Payload REST API (/api/certificates) with depth=1 to populate course_run.
 * Access control on the collection ensures only the user's own certificates are returned.
 */
export async function fetchCertificates(options?: {
    cookie?: string;
    limit?: number;
    page?: number;
}): Promise<CertificatesResponse> {
    const params = new URLSearchParams();
    params.set('depth', '1');
    params.set('sort', '-issued_at');
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.page) params.set('page', String(options.page));

    const headers: Record<string, string> = {};
    if (options?.cookie) {
        headers['Cookie'] = options.cookie;
    }

    const res = await fetch(`${API_BASE}/api/certificates?${params}`, {
        credentials: 'include',
        headers,
    });

    if (!res.ok) {
        if (res.status === 401) {
            return { docs: [], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false, hasPrevPage: false };
        }
        throw new Error(`Failed to fetch certificates: ${res.status}`);
    }

    return res.json();
}
