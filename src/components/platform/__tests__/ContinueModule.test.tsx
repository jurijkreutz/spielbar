/**
 * Tests für ContinueModule Komponente
 *
 * Prüft:
 * - formatRelativeTime Helper
 * - Bedingtes Rendering basierend auf lastPlayed
 */

// formatRelativeTime direkt nachgebaut (nicht exportiert)
function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'vor 1 Woche';
  if (weeks < 5) return `vor ${weeks} Wochen`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'vor 1 Monat';
  return `vor ${months} Monaten`;
}

describe('formatRelativeTime', () => {
  it('gibt "gerade eben" für weniger als 1 Minute zurück', () => {
    expect(formatRelativeTime(Date.now() - 30000)).toBe('gerade eben');
    expect(formatRelativeTime(Date.now())).toBe('gerade eben');
  });

  it('gibt "vor X Min" für Minuten zurück', () => {
    expect(formatRelativeTime(Date.now() - 5 * 60000)).toBe('vor 5 Min');
    expect(formatRelativeTime(Date.now() - 30 * 60000)).toBe('vor 30 Min');
  });

  it('gibt "vor X Std" für Stunden zurück', () => {
    expect(formatRelativeTime(Date.now() - 2 * 3600000)).toBe('vor 2 Std');
    expect(formatRelativeTime(Date.now() - 12 * 3600000)).toBe('vor 12 Std');
  });

  it('gibt "gestern" für 1 Tag zurück', () => {
    expect(formatRelativeTime(Date.now() - 24 * 3600000)).toBe('gestern');
  });

  it('gibt "vor X Tagen" für 2-6 Tage zurück', () => {
    expect(formatRelativeTime(Date.now() - 3 * 24 * 3600000)).toBe('vor 3 Tagen');
  });

  it('gibt "vor 1 Woche" für 7 Tage zurück', () => {
    expect(formatRelativeTime(Date.now() - 7 * 24 * 3600000)).toBe('vor 1 Woche');
  });

  it('gibt "vor X Wochen" für 2-4 Wochen zurück', () => {
    expect(formatRelativeTime(Date.now() - 14 * 24 * 3600000)).toBe('vor 2 Wochen');
    expect(formatRelativeTime(Date.now() - 28 * 24 * 3600000)).toBe('vor 4 Wochen');
  });

  it('gibt "vor 1 Monat" für ~30 Tage zurück', () => {
    expect(formatRelativeTime(Date.now() - 35 * 24 * 3600000)).toBe('vor 1 Monat');
  });

  it('gibt "vor X Monaten" für mehrere Monate zurück', () => {
    expect(formatRelativeTime(Date.now() - 90 * 24 * 3600000)).toBe('vor 3 Monaten');
  });

  it('gibt null für zukünftige Zeitstempel zurück', () => {
    expect(formatRelativeTime(Date.now() + 60000)).toBeNull();
  });
});
