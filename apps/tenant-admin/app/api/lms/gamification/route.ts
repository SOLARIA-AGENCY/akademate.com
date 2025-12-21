/**
 * LMS Gamification API Routes
 * 
 * Exposes gamification features from @akademate/lms
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/lms/gamification?userId=X
 * 
 * Get gamification data for a user (badges, points, streaks)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const type = searchParams.get('type'); // badges, points, streaks, leaderboard

        if (!userId && type !== 'leaderboard') {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        const payload = await getPayloadHMR({ config: configPromise });

        if (type === 'leaderboard') {
            // Get top users by total points
            const transactions = await payload.find({
                collection: 'points-transactions',
                limit: 100,
                depth: 1,
            });

            // Aggregate points by user
            const pointsByUser: Record<string, { userId: string; totalPoints: number; userName?: string }> = {};

            transactions.docs.forEach((tx: any) => {
                const uid = typeof tx.user === 'object' ? tx.user.id : tx.user;
                if (!pointsByUser[uid]) {
                    pointsByUser[uid] = {
                        userId: uid,
                        totalPoints: 0,
                        userName: typeof tx.user === 'object' ? tx.user.name : undefined,
                    };
                }
                pointsByUser[uid].totalPoints += tx.points || 0;
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
        const badges = await payload.find({
            collection: 'user-badges',
            where: { user: { equals: userId } },
            depth: 1,
        });

        // Get user points transactions
        const points = await payload.find({
            collection: 'points-transactions',
            where: { user: { equals: userId } },
            sort: '-createdAt',
            limit: 50,
        });

        const totalPoints = points.docs.reduce(
            (acc: number, tx: any) => acc + (tx.points || 0),
            0
        );

        // Get user streaks
        const streaks = await payload.find({
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
                streak: streaks.docs[0] || { currentStreak: 0, longestStreak: 0 },
            },
        });
    } catch (error: any) {
        console.error('[LMS Gamification] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch gamification data' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/lms/gamification
 * 
 * Award points to a user
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, points, reason, sourceType, sourceId } = body;

        if (!userId || !points || !reason) {
            return NextResponse.json(
                { success: false, error: 'userId, points, and reason are required' },
                { status: 400 }
            );
        }

        const payload = await getPayloadHMR({ config: configPromise });

        // Create points transaction
        const transaction = await payload.create({
            collection: 'points-transactions',
            data: {
                user: userId,
                points,
                reason,
                sourceType: sourceType || 'manual',
                sourceId: sourceId || null,
            } as any,
        });

        // Update user streak
        const existingStreak = await payload.find({
            collection: 'user-streaks',
            where: { user: { equals: userId } },
            limit: 1,
        });

        if (existingStreak.docs.length > 0) {
            const streak = existingStreak.docs[0];
            const lastActivity = streak.lastActivityAt ? new Date(streak.lastActivityAt) : null;
            const today = new Date();
            const isConsecutiveDay = lastActivity &&
                (today.getTime() - lastActivity.getTime()) < (48 * 60 * 60 * 1000); // Within 48 hours

            await payload.update({
                collection: 'user-streaks',
                id: streak.id,
                data: {
                    currentStreak: isConsecutiveDay ? (streak.currentStreak || 0) + 1 : 1,
                    longestStreak: Math.max(
                        streak.longestStreak || 0,
                        isConsecutiveDay ? (streak.currentStreak || 0) + 1 : 1
                    ),
                    lastActivityAt: today.toISOString(),
                } as any,
            });
        } else {
            await payload.create({
                collection: 'user-streaks',
                data: {
                    user: userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActivityAt: new Date().toISOString(),
                } as any,
            });
        }

        return NextResponse.json({
            success: true,
            data: transaction,
            message: `Awarded ${points} points to user`,
        });
    } catch (error: any) {
        console.error('[LMS Gamification] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to award points' },
            { status: 500 }
        );
    }
}
