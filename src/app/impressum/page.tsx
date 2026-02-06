import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrCreateLegalImprint } from '@/lib/legalImprint';
import SiteFooter from '@/components/platform/SiteFooter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Impressum | Spielbar',
  description: 'Rechtliche Anbieterkennzeichnung von Spielbar.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  other: {
    googlebot: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
  alternates: {
    canonical: '/impressum',
  },
};

export default async function ImpressumPage() {
  const imprint = await getOrCreateLegalImprint();

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            ← Zur Startseite
          </Link>
          <img src="/spielbar.png" alt="Spielbar" className="h-8" />
        </div>
      </header>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-zinc-900">Impressum</h1>
            <p className="mt-3 text-sm text-zinc-500">
              Angaben gem. § 5 ECG und Offenlegung gem. Mediengesetz.
            </p>

            <div className="mt-8 space-y-7 text-zinc-700">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Anbieter
                </h2>
                <p className="mt-2">{imprint.companyName}</p>
                <p>{imprint.street}</p>
                <p>
                  {imprint.postalCode} {imprint.city}
                </p>
                <p>{imprint.country}</p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Kontakt
                </h2>
                <p className="mt-2">
                  E-Mail:{' '}
                  <a className="text-zinc-900 underline decoration-zinc-300" href={`mailto:${imprint.email}`}>
                    {imprint.email}
                  </a>
                </p>
                {imprint.phone && <p>Telefon: {imprint.phone}</p>}
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Vertretungsberechtigt
                </h2>
                <p className="mt-2">{imprint.representedBy}</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
