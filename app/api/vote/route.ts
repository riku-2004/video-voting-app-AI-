import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vote = await prisma.vote.findFirst({
        where: { userId: session.userId },
        include: { items: true },
        orderBy: { submittedAt: 'desc' }
    });

    if (!vote) {
        return NextResponse.json([]);
    }

    return NextResponse.json(vote.items.map(item => ({
        videoId: item.videoId,
        rank: item.rank
    })));
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { items } = body; // Array of { videoId, rank }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Delete existing votes for user
        await prisma.vote.deleteMany({
            where: { userId: session.userId }
        });

        // Create new vote with items
        await prisma.vote.create({
            data: {
                userId: session.userId,
                items: {
                    create: items.map((item: { videoId: string; rank: number }) => ({
                        videoId: item.videoId,
                        rank: item.rank
                    }))
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
