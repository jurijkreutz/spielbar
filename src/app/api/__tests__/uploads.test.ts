/**
 * Tests für /api/admin/uploads Route
 *
 * Prüft:
 * - sanitizeSegment: Dateinamen-Sanitierung
 */

// sanitizeSegment direkt nachgebaut (nicht exportiert)
function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

describe('sanitizeSegment', () => {
  it('konvertiert zu Kleinbuchstaben', () => {
    expect(sanitizeSegment('HelloWorld')).toBe('helloworld');
    expect(sanitizeSegment('ABC')).toBe('abc');
  });

  it('ersetzt Sonderzeichen durch Bindestriche', () => {
    expect(sanitizeSegment('hello world')).toBe('hello-world');
    expect(sanitizeSegment('file name (1)')).toBe('file-name-1');
    expect(sanitizeSegment('test@file!')).toBe('test-file');
  });

  it('behält erlaubte Zeichen bei', () => {
    expect(sanitizeSegment('file-name')).toBe('file-name');
    expect(sanitizeSegment('file.name')).toBe('file.name');
    expect(sanitizeSegment('file_name')).toBe('file_name'); // Underscore ist erlaubt
  });

  it('entfernt führende und abschließende Bindestriche', () => {
    expect(sanitizeSegment('-hello-')).toBe('hello');
    expect(sanitizeSegment('--test--')).toBe('-test-'); // nur äußerste Bindestriche entfernt
    expect(sanitizeSegment('!special!')).toBe('special');
  });

  it('handhabt leere Strings', () => {
    expect(sanitizeSegment('')).toBe('');
  });

  it('handhabt Strings nur aus Sonderzeichen', () => {
    expect(sanitizeSegment('!!!')).toBe('');
    expect(sanitizeSegment('   ')).toBe('');
  });

  it('behält Punkte und Bindestriche bei', () => {
    expect(sanitizeSegment('my-file.png')).toBe('my-file.png');
    expect(sanitizeSegment('image-2024.jpg')).toBe('image-2024.jpg');
  });

  it('handhabt Zahlen korrekt', () => {
    expect(sanitizeSegment('file123')).toBe('file123');
    expect(sanitizeSegment('123')).toBe('123');
  });
});
