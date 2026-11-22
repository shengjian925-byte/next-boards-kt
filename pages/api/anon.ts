import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const raw = process.env.MONGODB_URI || '';
if (raw.includes('mongodb.net/?')) {
  process.env.MONGODB_URI = raw.replace('mongodb.net/?', 'mongodb.net/nextboard?');
} else if (raw.endsWith('mongodb.net') || raw.endsWith('mongodb.net/')) {
  process.env.MONGODB_URI = raw.replace(/\/?$/, '/nextboard');
}

const g = global as unknown as { prisma: PrismaClient };
const prisma = g.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const posts = await prisma.anonPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    return res.status(200).json(posts);
  }
  if (req.method === 'POST') {
    const { action, postId, name, title, content, image } = req.body;
    if ((action === 'like' || action === 'unlike') && postId) {
      const current = await prisma.anonPost.findUnique({ where: { id: postId } });
      const diff = action === 'like' ? 1 : -1;
      const nextLikes = Math.max(0, (current?.likes || 0) + diff);
      const updated = await prisma.anonPost.update({
        where: { id: postId },
        data: { likes: nextLikes },
      });
      return res.status(200).json(updated);
    }
    if (!content?.trim() && !image) return res.status(400).json({ error: '入力必須' });
    const n = name?.trim() || '名無しさん';
    const c = content?.trim() || '';
    const img = typeof image === 'string' && image.startsWith('data:image/') ? image : null;
    if (postId) {
      const r = await prisma.anonReply.create({ data: { postId, name: n, content: c, image: img } });
      return res.status(201).json(r);
    }
    const p = await prisma.anonPost.create({ data: { name: n, title: title?.trim() || '無題', content: c, image: img } });
    return res.status(201).json(p);
  }
  return res.status(405).end();
}
