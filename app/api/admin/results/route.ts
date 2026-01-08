import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Calculate score based on rank and total videos
// Average should be 10
function calculateScore(rank: number, totalVideos: number): number {
    if (totalVideos === 1) return 10;

    if (totalVideos % 2 === 1) {
        // Odd: center at 10
        const mid = Math.ceil(totalVideos / 2);
        return 10 + (mid - rank);
    } else {
        // Even: split around 10
        const mid = totalVideos / 2;
        if (rank <= mid) {
            return 11 + (mid - rank);
        } else {
            return 9 - (rank - mid - 1);
        }
    }
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all votes, comments, videos, and users
    const [votes, comments, videos, users] = await Promise.all([
        prisma.vote.findMany({
            include: { items: true, user: true }
        }),
        prisma.comment.findMany({
            include: { user: true }
        }),
        prisma.video.findMany(),
        prisma.user.findMany({ where: { role: 'user' } })
    ]);

    // Build results per video
    const videoResults = videos.map(video => {
        const videoVotes: { userName: string; score: number; comment: string }[] = [];

        votes.forEach(vote => {
            // Count how many videos this user voted on
            const userVideoCount = vote.items.length;

            // Find the rank for this video
            const voteItem = vote.items.find(item => item.videoId === video.id);
            if (voteItem) {
                const score = calculateScore(voteItem.rank, userVideoCount);

                // Find comment for this video by this user
                const userComment = comments.find(
                    c => c.videoId === video.id && c.userId === vote.userId
                );

                videoVotes.push({
                    userName: vote.user.name,
                    score,
                    comment: userComment?.body || ''
                });
            }
        });

        // Calculate average score
        const totalScore = videoVotes.reduce((sum, v) => sum + v.score, 0);
        const averageScore = videoVotes.length > 0 ? totalScore / videoVotes.length : 0;

        return {
            videoId: video.id,
            videoTitle: video.title || 'Untitled',
            channelName: video.channelName,
            votes: videoVotes,
            totalScore,
            averageScore: Math.round(averageScore * 100) / 100,
            voteCount: videoVotes.length
        };
    });

    // Sort by average score descending
    videoResults.sort((a, b) => b.averageScore - a.averageScore);

    // Get list of users who have submitted votes
    const submittedUsers = votes.map(v => ({
        id: v.userId,
        name: v.user.name,
        submittedAt: v.submittedAt
    }));

    // Get list of users who haven't submitted yet
    const submittedUserIds = new Set(votes.map(v => v.userId));
    const pendingUsers = users.filter(u => !submittedUserIds.has(u.id)).map(u => ({
        id: u.id,
        name: u.name
    }));

    return NextResponse.json({
        videoResults,
        submittedUsers,
        pendingUsers,
        totalUsers: users.length,
        submittedCount: submittedUsers.length
    });
}
