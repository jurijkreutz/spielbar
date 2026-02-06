'use client';

import { type FormEvent, useMemo, useState } from 'react';
import type { ContactRequest, LegalImprint } from '@prisma/client';

interface LegalContactAdminProps {
  initialImprint: LegalImprint;
  initialRequests: ContactRequest[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ImprintForm {
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  representedBy: string;
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LegalContactAdmin({
  initialImprint,
  initialRequests,
}: LegalContactAdminProps) {
  const [imprint, setImprint] = useState<ImprintForm>({
    companyName: initialImprint.companyName,
    street: initialImprint.street,
    postalCode: initialImprint.postalCode,
    city: initialImprint.city,
    country: initialImprint.country,
    email: initialImprint.email,
    phone: initialImprint.phone || '',
    representedBy: initialImprint.representedBy,
  });
  const [requests, setRequests] = useState<ContactRequest[]>(initialRequests);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasRequests = useMemo(() => requests.length > 0, [requests.length]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaveState('saving');
    setSaveError(null);

    try {
      const response = await fetch('/api/admin/impressum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imprint),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Speichern fehlgeschlagen.');
      }

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.');
    }
  };

  const toggleRequestStatus = async (requestId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'read' ? 'new' : 'read';
    const response = await fetch(`/api/admin/contact-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) return;

    setRequests((prev) => prev.map((item) => (
      item.id === requestId ? { ...item, status: nextStatus } : item
    )));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">Impressum</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Die Angaben werden auf der Impressum-Seite veröffentlicht.
        </p>

        <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">Firmenname</span>
            <input
              value={imprint.companyName}
              onChange={(event) => setImprint((prev) => ({ ...prev, companyName: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">Vertreten durch</span>
            <input
              value={imprint.representedBy}
              onChange={(event) => setImprint((prev) => ({ ...prev, representedBy: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-zinc-600">Straße / Hausnummer</span>
            <input
              value={imprint.street}
              onChange={(event) => setImprint((prev) => ({ ...prev, street: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">PLZ</span>
            <input
              value={imprint.postalCode}
              onChange={(event) => setImprint((prev) => ({ ...prev, postalCode: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">Ort</span>
            <input
              value={imprint.city}
              onChange={(event) => setImprint((prev) => ({ ...prev, city: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">Land</span>
            <input
              value={imprint.country}
              onChange={(event) => setImprint((prev) => ({ ...prev, country: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">E-Mail</span>
            <input
              type="email"
              value={imprint.email}
              onChange={(event) => setImprint((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">Telefon (optional)</span>
            <input
              value={imprint.phone}
              onChange={(event) => setImprint((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
            >
              {saveState === 'saving' ? 'Speichert…' : 'Impressum speichern'}
            </button>
            {saveState === 'saved' && <p className="text-sm text-emerald-700">Gespeichert.</p>}
            {saveState === 'error' && saveError && (
              <p className="text-sm text-rose-700">{saveError}</p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">Kontaktanfragen</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Feedback, Bugs und Verbesserungsvorschläge aus dem Kontaktformular.
        </p>

        {!hasRequests ? (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Noch keine Kontaktanfragen vorhanden.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
                  <th className="px-3 py-2">Zeit</th>
                  <th className="px-3 py-2">Quelle</th>
                  <th className="px-3 py-2">Kontakt</th>
                  <th className="px-3 py-2">Nachricht</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-zinc-100 align-top">
                    <td className="px-3 py-3 text-sm text-zinc-700">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-700">
                      <p>{request.sourcePath}</p>
                      {request.sourceContext && (
                        <p className="text-xs text-zinc-500">{request.sourceContext}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-700">
                      <p>{request.name || 'Anonym'}</p>
                      <p className="text-xs text-zinc-500">{request.email || 'keine E-Mail'}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-700">
                      <p className="line-clamp-3 max-w-sm whitespace-pre-wrap">{request.message}</p>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <button
                        onClick={() => toggleRequestStatus(request.id, request.status)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.status === 'read'
                            ? 'bg-zinc-100 text-zinc-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {request.status === 'read' ? 'Gelesen' : 'Neu'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
