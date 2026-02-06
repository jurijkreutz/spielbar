import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactModal from '../ContactModal';

jest.mock('next/navigation', () => ({
  usePathname: () => '/games/sudoku',
}));

describe('ContactModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as typeof globalThis & { fetch: jest.Mock }).fetch = jest.fn();
  });

  it('rendert nicht wenn geschlossen', () => {
    render(<ContactModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('zeigt Erfolg nach Submit ohne Navigation', async () => {
    const fetchMock = (globalThis as typeof globalThis & { fetch: jest.Mock }).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ContactModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Nachricht'), {
      target: { value: 'Das ist ein valider Feedbacktext mit ausreichender Länge.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Absenden' }));

    await waitFor(() => {
      expect(screen.getByText(/Danke für dein Feedback/)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('zeigt Fehler bei fehlgeschlagenem Submit', async () => {
    (globalThis as typeof globalThis & { fetch: jest.Mock }).fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Senden fehlgeschlagen.' }),
    } as Response);

    render(<ContactModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Nachricht'), {
      target: { value: 'Das ist ein valider Feedbacktext mit ausreichender Länge.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Absenden' }));

    await waitFor(() => {
      expect(screen.getByText('Senden fehlgeschlagen.')).toBeInTheDocument();
    });
  });
});
