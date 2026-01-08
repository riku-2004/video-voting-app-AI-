import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find the user's vote
        const vote = await prisma.vote.findFirst({
            where: { userId: session.userId }
        });

        if (!vote) {
            return NextResponse.json({ error: '先にランキングを保存してください' }, { status: 400 });
        }

        // Mark as submitted
        await prisma.vote.update({
            where: { id: vote.id },
            data: {
                isSubmitted: true,
                submittedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submit error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has submitted their vote
    const vote = await prisma.vote.findFirst({
        where: { userId: session.userId }
    });

    return NextResponse.json({
        hasVote: !!vote,
        isSubmitted: vote?.isSubmitted ?? false
    });
}
