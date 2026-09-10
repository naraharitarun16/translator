'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getMessages() {
  const userId = await getUserId()
  const rows = await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt))
  if (rows.length) return rows
  const seeded = [
    { id: crypto.randomUUID(), userId, senderName: 'Aarav Mehta', senderHandle: '@aarav', sourceLanguage: 'English', body: 'The launch plan is ready. Let’s review it together tomorrow morning.', createdAt: new Date() },
    { id: crypto.randomUUID(), userId, senderName: 'Priya Sharma', senderHandle: '@priya', sourceLanguage: 'Hindi', body: 'आज की बैठक के बाद मैं आपको अगले चरण भेज दूंगी।', createdAt: new Date(Date.now() - 3600000) },
  ]
  await db.insert(messages).values(seeded)
  return seeded
}
