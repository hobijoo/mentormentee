import { revalidatePath } from 'next/cache';
import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function GET() {
    await logout();
    revalidatePath('/');
    redirect('/login');
}
