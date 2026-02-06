import { NextRequest, NextResponse } from 'next/server';

const BOT_SIGNATURES = [
  'googlebot',
  'bingbot',
  'yandex',
  'duckduckbot',
  'baiduspider',
  'slurp',
  'crawler',
  'spider',
  'facebookexternalhit',
  'twitterbot',
  'discordbot',
  'slackbot',
  'whatsapp',
  'telegrambot',
];

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/impressum') {
    return NextResponse.next();
  }

  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const isBot = BOT_SIGNATURES.some((signature) => userAgent.includes(signature));

  if (isBot) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/impressum'],
};
