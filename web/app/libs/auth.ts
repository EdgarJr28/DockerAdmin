import { cookies } from 'next/headers';
export async function getSession() {
    const token = (await cookies()).get('auth')?.value;
    return token ? { user: { email: 'admin@example.com' }, token } : null;
}
