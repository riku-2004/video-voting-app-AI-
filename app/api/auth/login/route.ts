import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { login } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, password } = body;

        if (!userId || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        await login(user.id, user.name, user.role as 'admin' | 'user');

        return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    // Return list of users for dropdown (excluding passwordHash)
    const users = await prisma.user.findMany({
        select: { id: true, name: true }
    });
    return NextResponse.json(users);
}
