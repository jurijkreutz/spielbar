'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  name: string;
  email: string;
  message: string;
  honeypot: string;
}

function getSourceContext(pathname: string): string | null {
  const gameMatch = pathname.match(/^\/games\/([^/]+)/);
  if (gameMatch?.[1]) {
    return `game:${gameMatch[1]}`;
  }

  if (pathname.startsWith('/news')) {
    return 'news';
  }

  return null;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const pathname = usePathname() || '/';
  const sourceContext = useMemo(() => getSourceContext(pathname), [pathname]);
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>({
    name: '',
    email: '',
    message: '',
    honeypot: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setState('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          sourcePath: pathname,
          sourceContext,
          honeypot: form.honeypot,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error || 'Senden fehlgeschlagen.');
        setState('error');
        return;
      }

      setState('success');
      setForm({
        name: '',
        email: '',
        message: '',
        honeypot: '',
      });
    } catch {
      setState('error');
      setError('Senden fehlgeschlagen.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kontakt-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="kontakt-title" className="text-lg font-semibold text-zinc-900">
            Kontakt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-900"
            aria-label="Kontaktformular schließen"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {state === 'success' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Danke für dein Feedback. Wir haben deine Nachricht erhalten.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <p className="text-sm text-zinc-600">
                Feedback, Bugs oder Verbesserungsvorschläge. Wir freuen uns über jede Nachricht.
              </p>

              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  value={form.honeypot}
                  onChange={(event) => setForm((prev) => ({ ...prev, honeypot: event.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-zinc-700">
                  Name (optional)
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-zinc-700">
                  E-Mail (optional)
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-zinc-700">
                  Nachricht
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  placeholder="Was können wir verbessern?"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                >
                  {state === 'submitting' ? 'Wird gesendet…' : 'Absenden'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
