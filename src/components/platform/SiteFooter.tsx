'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TrackedLink } from '@/components/platform/TrackedLink';
import ContactModal from '@/components/platform/ContactModal';

interface FooterBackLink {
  label: string;
  href: string;
  trackingFrom?: string;
}

interface SiteFooterProps {
  backLink?: FooterBackLink;
}

export default function SiteFooter({ backLink }: SiteFooterProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="bg-zinc-900 py-8 text-zinc-400">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-sm">
              {backLink ? (
                backLink.trackingFrom ? (
                  <TrackedLink
                    href={backLink.href}
                    tracking={{ type: 'game_exit_to_overview', from: backLink.trackingFrom }}
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    {backLink.label}
                  </TrackedLink>
                ) : (
                  <Link href={backLink.href} className="text-zinc-400 transition-colors hover:text-white">
                    {backLink.label}
                  </Link>
                )
              ) : null}

              <Link href="/impressum" className="text-zinc-400 transition-colors hover:text-white">
                Impressum
              </Link>
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="text-zinc-400 transition-colors hover:text-white"
              >
                Kontakt
              </button>
            </div>

            <p className="text-sm">© {year} Spielbar. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
