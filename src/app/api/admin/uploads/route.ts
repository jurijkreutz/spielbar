import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const slug = formData.get('slug')?.toString() || 'game';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Keine Datei erhalten' }, { status: 400 });
    }

    const filename = file.name || 'background';
    const safeSlug = sanitizeSegment(slug) || 'game';
    const timestamp = Date.now();

    const extension = path.extname(filename);
    const baseName = sanitizeSegment(path.basename(filename, extension)) || 'background';
    const safeFilename = `${timestamp}-${baseName}${extension || ''}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeSlug);
    await mkdir(uploadDir, { recursive: true });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, fileBuffer);

    return NextResponse.json({ url: `/uploads/${safeSlug}/${safeFilename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Upload' },
      { status: 500 }
    );
  }
}
