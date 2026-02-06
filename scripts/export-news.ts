import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const outputPath = path.join(process.cwd(), 'prisma', 'seed-data', 'news.json');

  const news = await prisma.news.findMany({
    orderBy: [{ createdAt: 'asc' }],
  });

  const payload = news.map((item) => ({
    slug: item.slug,
    title: item.title,
    teaser: item.teaser,
    content: item.content,
    thumbnail: item.thumbnail,
    status: item.status,
    pinned: item.pinned,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
  }));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`✅ ${payload.length} News nach prisma/seed-data/news.json exportiert`);
}

main()
  .catch((error) => {
    console.error('❌ Export fehlgeschlagen:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
