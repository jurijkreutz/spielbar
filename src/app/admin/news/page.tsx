import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import { NewsListItem } from '@/components/admin/NewsListItem';

export const dynamic = 'force-dynamic';


export default async function AdminNewsPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const news = await prisma.news.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader active="news" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">News verwalten</h2>
          <Link
            href="/admin/news/new"
            className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Neue News
          </Link>
        </div>

        {news.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
            <p className="text-zinc-600">Noch keine News vorhanden.</p>
            <Link
              href="/admin/news/new"
              className="inline-block mt-4 text-zinc-900 font-medium hover:underline"
            >
              Erste News schreiben →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Titel
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Pinned
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {news.map((item) => (
                  <NewsListItem key={item.id} news={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
