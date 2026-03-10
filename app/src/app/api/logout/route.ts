import { revalidatePath } from 'next/cache';
import { getSessionUser, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function GET() {
    await logout();
    revalidatePath('/');
    redirect('/login');
}
