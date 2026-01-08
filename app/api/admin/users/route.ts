import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, role = 'user', password } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'ユーザー名は必須です' }, { status: 400 });
        }

        // Check if name already exists
        const existingUser = await prisma.user.findUnique({
            where: { name: name.trim() }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 400 });
        }

        // Default password is user's name if not provided
        const defaultPassword = password || name.trim();
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                passwordHash,
                role: role === 'admin' ? 'admin' : 'user',
            }
        });

        return NextResponse.json({
            success: true,
            user: { id: newUser.id, name: newUser.name, role: newUser.role },
            defaultPassword: defaultPassword
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'ユーザーIDは必須です' }, { status: 400 });
        }

        // Don't allow deleting yourself
        if (userId === session.userId) {
            return NextResponse.json({ error: '自分自身を削除することはできません' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
