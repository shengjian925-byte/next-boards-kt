import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const rawUrl = process.env.MONGODB_URI || '';
if (rawUrl.includes('mongodb.net/?')) {
  process.env.MONGODB_URI = rawUrl.replace('mongodb.net/?', 'mongodb.net/nextboard?');
} else if (rawUrl.endsWith('mongodb.net') || rawUrl.endsWith('mongodb.net/')) {
  process.env.MONGODB_URI = rawUrl.replace(/\/?$/, '/nextboard');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const posts = await prisma.anonPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ error: '取得エラー', details: String(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, title, content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: '本文を入力してください' });
      }
      const post = await prisma.anonPost.create({
        data: {
          name: name && name.trim() ? name.trim() : '名無しさん',
          title: title && title.trim() ? title.trim() : '無題',
          content: content.trim(),
        },
      });
      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ error: '投稿エラー', details: String(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

