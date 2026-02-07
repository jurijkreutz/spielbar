import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_PASSWORD_LENGTH = 8;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const userId =
    session?.user && typeof session.user.id === 'string'
      ? session.user.id
      : null;
  const userEmail =
    session?.user && typeof session.user.email === 'string'
      ? session.user.email
      : null;

  if (!userId && !userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return badRequest('Ungültige Anfrage.');
    }
    payload = body as Record<string, unknown>;
  } catch {
    return badRequest('Ungültige Anfrage.');
  }

  const currentPassword =
    typeof payload.currentPassword === 'string' ? payload.currentPassword : '';
  const newPassword =
    typeof payload.newPassword === 'string' ? payload.newPassword : '';
  const confirmPassword =
    typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

  if (!currentPassword) {
    return badRequest('Aktuelles Passwort ist erforderlich.');
  }

  if (!newPassword) {
    return badRequest('Neues Passwort ist erforderlich.');
  }

  if (!confirmPassword) {
    return badRequest('Bitte bestätige das neue Passwort.');
  }

  if (newPassword !== confirmPassword) {
    return badRequest('Die neuen Passwörter stimmen nicht überein.');
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return badRequest(
      `Das neue Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`
    );
  }

  if (newPassword === currentPassword) {
    return badRequest('Das neue Passwort muss sich vom aktuellen unterscheiden.');
  }

  try {
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, password: true },
        })
      : await prisma.user.findUnique({
          where: { email: userEmail as string },
          select: { id: true, password: true },
        });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!currentPasswordMatches) {
      return badRequest('Das aktuelle Passwort ist falsch.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert.',
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json(
      { error: 'Passwort konnte nicht geändert werden.' },
      { status: 500 }
    );
  }
}
