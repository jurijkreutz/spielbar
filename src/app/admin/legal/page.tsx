import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateLegalImprint } from '@/lib/legalImprint';
import AdminHeader from '@/components/admin/AdminHeader';
import LegalContactAdmin from '@/components/admin/LegalContactAdmin';

export default async function AdminLegalPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const [imprint, requests] = await Promise.all([
    getOrCreateLegalImprint(),
    prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader active="legal" />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900">Recht &amp; Kontakt</h2>
        <LegalContactAdmin initialImprint={imprint} initialRequests={requests} />
      </main>
    </div>
  );
}
