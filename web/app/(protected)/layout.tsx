import { redirect } from 'next/navigation';
import { getSession } from '../libs/auth';
import ClientShell from '../components/layout/ClientShell';


export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) redirect('/login');
    return <ClientShell>{children}</ClientShell>;
}
