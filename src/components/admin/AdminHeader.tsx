import Link from 'next/link';
import { signOut } from '@/lib/auth';

type AdminSection = 'dashboard' | 'games' | 'news' | 'analytics';

interface AdminHeaderProps {
  active: AdminSection;
}

const NAV_ITEMS: Array<{ key: AdminSection; href: string; label: string }> = [
  { key: 'dashboard', href: '/admin', label: 'Dashboard' },
  { key: 'games', href: '/admin/games', label: 'Spiele' },
  { key: 'news', href: '/admin/news', label: 'News' },
  { key: 'analytics', href: '/admin/analytics', label: 'Analytics' },
];

export default function AdminHeader({ active }: AdminHeaderProps) {
  return (
    <header className="bg-zinc-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold">
              Spielbar Admin
            </Link>
            <nav className="hidden md:flex items-center gap-4 ml-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    item.key === active
                      ? 'text-white font-medium'
                      : 'text-zinc-300 hover:text-white transition-colors'
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-zinc-400 hover:text-white text-sm"
            >
              Seite ansehen ↗
            </Link>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/admin/login' });
              }}
            >
              <button
                type="submit"
                className="text-zinc-400 hover:text-white text-sm"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
