import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import { GameForm } from '@/components/admin/GameForm';

export const dynamic = 'force-dynamic';


interface EditGamePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
  });

  if (!game) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader active="games" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/games"
            className="text-zinc-600 hover:text-zinc-900 text-sm"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            {game.name} bearbeiten
          </h2>
          <GameForm game={game} />
        </div>
      </main>
    </div>
  );
}
