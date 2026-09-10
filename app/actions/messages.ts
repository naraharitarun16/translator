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

async function translateText(text: string, targetLanguage: string) {
  const languageCodes: Record<string, string> = { English: 'en', Hindi: 'hi', Spanish: 'es', French: 'fr', Japanese: 'ja', Tamil: 'ta', German: 'de' }
  const targetCode = languageCodes[targetLanguage] || targetLanguage
  const params = new URLSearchParams({ q: text, langpair: `autodetect|${targetCode}`, mt: '1' })
  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Free translation service unavailable')
  const result = (await response.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
  const translated = result.responseData?.translatedText?.trim()
  if (!translated || result.responseStatus !== 200) throw new Error('Translation failed')
  return translated
}

export async function getMessages() {
  const userId = await getUserId()
  const rows = await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt))
  if (rows.length) return rows
  const seeded = [
    { id: crypto.randomUUID(), userId, senderName: 'Aarav Mehta', senderHandle: '@aarav', recipientName: 'You', recipientEmail: '', direction: 'inbound', sourceLanguage: 'English', body: 'The launch plan is ready. Let’s review it together tomorrow morning.', translatedBody: null, createdAt: new Date() },
    { id: crypto.randomUUID(), userId, senderName: 'Priya Sharma', senderHandle: '@priya', recipientName: 'You', recipientEmail: '', direction: 'inbound', sourceLanguage: 'Hindi', body: 'आज की बैठक के बाद मैं आपको अगले चरण भेज दूंगी।', translatedBody: null, createdAt: new Date(Date.now() - 3600000) },
  ]
  await db.insert(messages).values(seeded)
  return seeded
}

export async function sendMessage(input: { recipientName: string; recipientEmail: string; text: string; sourceLanguage: string; targetLanguage: string }) {
  const userId = await getUserId()
  const text = input.text.trim()
  if (!input.recipientName.trim() || !input.recipientEmail.trim() || !text || !input.sourceLanguage || !input.targetLanguage) throw new Error('Complete all message fields')
  const translated = await translateText(text, input.targetLanguage)
  const session = await auth.api.getSession({ headers: await headers() })
  const senderName = session?.user.name || 'You'
  const inserted = await db.insert(messages).values({
    id: crypto.randomUUID(), userId, senderName, senderHandle: '@you', recipientName: input.recipientName.trim(), recipientEmail: input.recipientEmail.trim(), direction: 'outbound', sourceLanguage: input.sourceLanguage, body: text, translatedBody: translated, createdAt: new Date(),
  }).returning()
  return inserted[0]
}
