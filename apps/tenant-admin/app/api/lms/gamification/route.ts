/**
 * LMS Gamification API Routes
 *
 * Exposes gamification features from @akademate/lms
 *
 * NOTE: Gamification collections (points-transactions, user-badges, user-streaks) are planned
 * but not yet in Payload config. Type assertions are required until
 * Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { campusEnvironmentError } from '@/src/lib/campus/environment';
import { readCampusSession } from '@/src/lib/campus/auth';

// ============================================================================
// Gamification Type Definitions
// These types represent the planned gamification collections
// ============================================================================

/** User reference - can be populated object or just ID string */
interface UserReference {
    id: string;
    name?: string;
    email?: string;
}

/** Points transaction record */
interface PointsTransaction {
    id: string;
    user: UserReference | string;
    points: number;
    reason: string;
    sourceType?: 'manual' | 'course-completion' | 'quiz' | 'assignment' | 'badge';
    sourceId?: string | null;
    createdAt: string;
    updatedAt: string;
}

/** User badge record */
interface UserBadge {
    id: string;
    user: UserReference | string;
    badge: {
        id: string;
        name: string;
        description?: string;
        icon?: string;
    } | string;
    earnedAt: string;
    createdAt: string;
    updatedAt: string;
}

/** User streak record */
interface UserStreak {
    id: string;
    user: UserReference | string;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Generic Payload find result structure */
interface PayloadFindResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
}

/** Leaderboard entry */
interface LeaderboardEntry {
    userId: string;
    totalPoints: number;
    userName?: string;
}

/** Error with message property */
interface ErrorWithMessage {
    message: string;
}

/** Type guard to check if error has message */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as ErrorWithMessage).message === 'string'
    );
}

/** Get error message from unknown error */
function getErrorMessage(error: unknown): string {
    if (isErrorWithMessage(error)) {
        return error.message;
    }
    return 'An unknown error occurred';
}

/**
 * Extended Payload interface for gamification collections
 * These collections are planned but not yet in Payload config
 */
interface GamificationPayload {
    find(args: {
        collection: 'points-transactions';
        where?: Record<string, unknown>;
        sort?: string;
        limit?: number;
        depth?: number;
    }): Promise<PayloadFindResult<PointsTransaction>>;
    find(args: {
        collection: 'user-badges';
        where?: Record<string, unknown>;
        sort?: string;
        limit?: number;
        depth?: number;
    }): Promise<PayloadFindResult<UserBadge>>;
    find(args: {
        collection: 'user-streaks';
        where?: Record<string, unknown>;
        sort?: string;
        limit?: number;
        depth?: number;
    }): Promise<PayloadFindResult<UserStreak>>;
    create(args: {
        collection: 'points-transactions';
        data: Omit<PointsTransaction, 'id' | 'createdAt' | 'updatedAt'>;
    }): Promise<PointsTransaction>;
    create(args: {
        collection: 'user-streaks';
        data: Omit<UserStreak, 'id' | 'createdAt' | 'updatedAt'>;
    }): Promise<UserStreak>;
    update(args: {
        collection: 'user-streaks';
        id: string;
        data: Partial<Omit<UserStreak, 'id' | 'createdAt' | 'updatedAt'>>;
    }): Promise<UserStreak>;
}

/**
 * Get Payload instance typed for gamification operations
 * Uses type assertion since gamification collections are planned but not in config
 */
async function getGamificationPayload(): Promise<GamificationPayload> {
    // Payload's HMR utility returns an error-typed value; cast through unknown is intentional
     
    const payload: unknown = await getPayload({ config: configPromise });
    return payload as GamificationPayload;
}

/**
 * GET /api/lms/gamification?userId=X
 *
 * Get gamification data for a user (badges, points, streaks)
 */
export async function GET(request: NextRequest) {
    try {
        const environmentError = campusEnvironmentError();
        if (environmentError) return environmentError;
        const session = await readCampusSession(request);
        if (!session) return NextResponse.json({ success: false, error: 'Sesion no autorizada' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // badges, points, streaks, leaderboard
        const userId = session.student.id;

        const gamificationPayload = await getGamificationPayload();

        if (type === 'leaderboard') {
            // Get top users by total points
            // Note: points-transactions collection is planned but not yet implemented
            const transactions = await gamificationPayload.find({
                collection: 'points-transactions',
                limit: 100,
                depth: 1,
            });

            // Aggregate points by user
            const pointsByUser: Record<string, LeaderboardEntry> = {};

            transactions.docs.forEach((tx: PointsTransaction) => {
                const userRef = tx.user;
                const uid = typeof userRef === 'object' ? userRef.id : userRef;
                pointsByUser[uid] ??= {
                    userId: uid,
                    totalPoints: 0,
                    userName: typeof userRef === 'object' ? userRef.name : undefined,
                };
                pointsByUser[uid].totalPoints += tx.points ?? 0;
            });

            const leaderboard = Object.values(pointsByUser)
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .slice(0, 10);

            return NextResponse.json({
                success: true,
                data: { leaderboard },
            });
        }

        // Get user badges
        // Note: user-badges collection is planned but not yet implemented
        const badges = await gamificationPayload.find({
            collection: 'user-badges',
            where: { user: { equals: userId } },
            depth: 1,
        });

        // Get user points transactions
        const points = await gamificationPayload.find({
            collection: 'points-transactions',
            where: { user: { equals: userId } },
            sort: '-createdAt',
            limit: 50,
        });

        const totalPoints = points.docs.reduce(
            (acc: number, tx: PointsTransaction) => acc + (tx.points || 0),
            0
        );

        // Get user streaks
        const streaks = await gamificationPayload.find({
            collection: 'user-streaks',
            where: { user: { equals: userId } },
            limit: 1,
        });

        return NextResponse.json({
            success: true,
            data: {
                userId,
                badges: badges.docs,
                totalBadges: badges.totalDocs,
                totalPoints,
                recentTransactions: points.docs.slice(0, 10),
                streak: streaks.docs[0] ?? { currentStreak: 0, longestStreak: 0 },
            },
        });
    } catch (error: unknown) {
        console.error('[LMS Gamification] Error:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to fetch gamification data' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/lms/gamification
 *
 * Point awards are deliberately not exposed to the browser. A future trusted
 * server-side event handler can call the planned persistence layer directly.
 */
export async function POST(request: NextRequest) {
    const environmentError = campusEnvironmentError();
    if (environmentError) return environmentError;
    const session = await readCampusSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Sesion no autorizada' }, { status: 401 });

    // Points must be awarded by a trusted server-side event, never by a
    // browser-controlled userId/points payload.
    return NextResponse.json(
        { success: false, error: 'La asignacion de puntos requiere un evento interno autorizado' },
        { status: 403 },
    );
}
