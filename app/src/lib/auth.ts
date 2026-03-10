import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'user_session';

export async function setSessionCookie(userId: number, role: string) {
    const value = JSON.stringify({ userId, role });
    const encoded = Buffer.from(value).toString('base64');
    (await cookies()).set(SESSION_COOKIE_NAME, encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });
}

export async function getSessionUser() {
    const cookie = (await cookies()).get(SESSION_COOKIE_NAME);
    if (!cookie) return null;
    try {
        const decoded = Buffer.from(cookie.value, 'base64').toString('ascii');
        return JSON.parse(decoded) as { userId: number, role: string };
    } catch {
        return null;
    }
}

export async function logout() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
}
