import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find videos where user is cast
    const excludedVideoIds = await prisma.videoCast.findMany({
        where: { userId: session.userId },
        select: { videoId: true }
    });

    const excludedIds = excludedVideoIds.map(vc => vc.videoId);

    // Get active videos excluding those where user is cast
    const videos = await prisma.video.findMany({
        where: {
            isActive: true,
            id: { notIn: excludedIds }
        },
        orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(videos);
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { url, title, description, channelName, castUserIds } = body;

        const video = await prisma.video.create({
            data: {
                url,
                title,
                description,
                channelName,
                isActive: true,
            }
        });

        // Add cast members if provided
        if (castUserIds && Array.isArray(castUserIds) && castUserIds.length > 0) {
            await prisma.videoCast.createMany({
                data: castUserIds.map((userId: string) => ({
                    videoId: video.id,
                    userId
                }))
            });
        }

        return NextResponse.json(video);
    } catch (error) {
        console.error('Create video error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
