import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        const stmt = db.prepare('SELECT id, password, role FROM users WHERE username = ?');
        const user = stmt.get(username) as { id: number, password: string, role: string } | undefined;

        if (user && user.password === password) {
            await setSessionCookie(user.id, user.role);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
