import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import { GameForm } from '@/components/admin/GameForm';

export default async function NewGamePage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
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
            Neues Spiel anlegen
          </h2>
          <GameForm />
        </div>
      </main>
    </div>
  );
}
