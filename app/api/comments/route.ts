import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    // Get comment for this user and video
    const comment = await prisma.comment.findFirst({
        where: {
            videoId,
            userId: session.userId
        }
    });

    return NextResponse.json(comment ? { body: comment.body } : { body: '' });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { videoId, comment } = body;

        if (!videoId) {
            return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
        }

        // Upsert comment (update if exists, create if not)
        const existingComment = await prisma.comment.findFirst({
            where: {
                videoId,
                userId: session.userId
            }
        });

        if (existingComment) {
            await prisma.comment.update({
                where: { id: existingComment.id },
                data: { body: comment || '' }
            });
        } else {
            await prisma.comment.create({
                data: {
                    videoId,
                    userId: session.userId,
                    body: comment || ''
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
