/**
 * API Client for Campus app
 * Fetches data from tenant-admin LMS endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3009';

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    meta?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// LESSON & MODULE TYPES
// ============================================================================

/**
 * Individual lesson progress tracking
 */
export interface LessonProgressItem {
    lessonId: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercent: number;
    timeSpentMinutes: number;
    lastPosition?: number;
    completedAt?: string;
}

/**
 * Lesson content - flexible structure for different content types
 */
export interface LessonContent {
    type: 'text' | 'video' | 'quiz' | 'assignment' | 'live_session';
    body?: string;
    html?: string;
    markdown?: string;
    questions?: QuizQuestion[];
    instructions?: string;
    dueDate?: string;
    sessionUrl?: string;
    scheduledAt?: string;
}

/**
 * Quiz question structure
 */
export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer?: string | number;
    points?: number;
}

/**
 * Course material/resource
 */
export interface MaterialData {
    id: string;
    title: string;
    type: 'pdf' | 'document' | 'link' | 'file' | 'video';
    url: string;
    size?: number;
    description?: string;
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

/**
 * User badge
 */
export interface BadgeData {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    earnedAt: string;
    category?: string;
}

/**
 * Point transaction record
 */
export interface PointTransactionData {
    id: string;
    points: number;
    type: 'earned' | 'spent' | 'bonus';
    reason: string;
    createdAt: string;
    lessonId?: string;
    courseId?: string;
}

// ============================================================================
// PROGRESS DATA
// ============================================================================

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
    lessonProgress: LessonProgressItem[];
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
    content?: LessonContent;
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
    materials?: MaterialData[];
    totalModules?: number;
    totalLessons?: number;
    totalMaterials?: number;
}

export interface GamificationData {
    userId: string;
    badges: BadgeData[];
    totalBadges: number;
    totalPoints: number;
    recentTransactions: PointTransactionData[];
    streak: {
        currentStreak: number;
        longestStreak: number;
        lastActivityAt?: string;
    };
}

// ============================================================================
// LESSON PROGRESS UPDATE
// ============================================================================

/**
 * Response from updating lesson progress
 */
export interface LessonProgressUpdateResponse {
    lessonId: string;
    enrollmentId: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercent: number;
    timeSpentMinutes: number;
    lastPosition?: number;
    updatedAt: string;
}

/**
 * Fetch progress for an enrollment
 */
export async function fetchProgress(enrollmentId: string): Promise<ProgressData> {
    const res = await fetch(`${API_BASE}/api/lms/progress?enrollmentId=${enrollmentId}`);
    const json = (await res.json()) as ApiResponse<ProgressData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch progress');
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
}): Promise<LessonProgressUpdateResponse> {
    const res = await fetch(`${API_BASE}/api/lms/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = (await res.json()) as ApiResponse<LessonProgressUpdateResponse>;
    if (!json.success) throw new Error(json.error ?? 'Failed to update progress');
    return json.data;
}

/**
 * Fetch modules for a course
 */
export async function fetchModules(courseId: string): Promise<ContentData> {
    const res = await fetch(`${API_BASE}/api/lms/content?courseId=${courseId}`);
    const json = (await res.json()) as ApiResponse<ContentData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch modules');
    return json.data;
}

/**
 * Fetch lessons for a module
 */
export async function fetchLessons(moduleId: string): Promise<ContentData> {
    const res = await fetch(`${API_BASE}/api/lms/content?moduleId=${moduleId}`);
    const json = (await res.json()) as ApiResponse<ContentData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch lessons');
    return json.data;
}

/**
 * Fetch gamification data for a user
 */
export async function fetchGamification(userId: string): Promise<GamificationData> {
    const res = await fetch(`${API_BASE}/api/lms/gamification?userId=${userId}`);
    const json = (await res.json()) as ApiResponse<GamificationData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch gamification data');
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
    modules: {
        id: string;
        title: string;
        description?: string;
        order: number;
        estimatedMinutes?: number;
        lessons: {
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
        }[];
        lessonsCount: number;
    }[];
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
}): Promise<{ data: EnrollmentData[]; meta: PaginationMeta }> {
    const params = new URLSearchParams();
    if (options?.userId) params.set('userId', options.userId);
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.page) params.set('page', String(options.page));

    const res = await fetch(`${API_BASE}/api/lms/enrollments?${params}`, {
        credentials: 'include',
    });
    const json = (await res.json()) as ApiResponse<EnrollmentData[]>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch enrollments');
    return { data: json.data, meta: json.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 } };
}

/**
 * Fetch enrollment details with course content
 */
export async function fetchEnrollmentDetail(enrollmentId: string): Promise<EnrollmentDetailData> {
    const res = await fetch(`${API_BASE}/api/lms/enrollments/${enrollmentId}`, {
        credentials: 'include',
    });
    const json = (await res.json()) as ApiResponse<EnrollmentDetailData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch enrollment detail');
    return json.data;
}

// ============================================================================
// MODULE DETAIL API
// ============================================================================

/**
 * Module detail with lessons and materials
 */
export interface ModuleDetailData {
    id: string;
    title: string;
    slug: string;
    description?: string;
    order: number;
    estimatedMinutes?: number;
    lessons: {
        id: string;
        title: string;
        slug: string;
        type: 'text' | 'video' | 'quiz' | 'assignment' | 'live_session';
        order: number;
        estimatedMinutes?: number;
        isMandatory: boolean;
        isPublished: boolean;
        progress?: {
            status: string;
            progressPercent: number;
            timeSpentMinutes: number;
        };
    }[];
    materials: MaterialData[];
    lessonsCount: number;
    materialsCount: number;
}

/**
 * Fetch module details with lessons and materials
 */
export async function fetchModuleDetail(moduleId: string, enrollmentId?: string): Promise<ModuleDetailData> {
    const params = enrollmentId ? `?enrollmentId=${enrollmentId}` : '';
    const res = await fetch(`${API_BASE}/api/lms/modules/${moduleId}${params}`, {
        credentials: 'include',
    });
    const json = (await res.json()) as ApiResponse<ModuleDetailData>;
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch module detail');
    return json.data;
}
