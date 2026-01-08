import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [videos, videoCast, users] = await Promise.all([
        prisma.video.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.videoCast.findMany(),
        prisma.user.findMany({ select: { id: true, name: true, role: true } })
    ]);

    return NextResponse.json({
        videos,
        videoCast,
        users,
    });
}
