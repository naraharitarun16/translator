'use server'

import { createClient } from '@/lib/supabase/server'

export type Message = {
  id: string
  user_id: string
  sender_name: string
  sender_handle: string
  recipient_name: string
  recipient_email: string
  direction: string
  source_language: string
  body: string
  translated_body: string | null
  created_at: string
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('message')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load messages')
  if (data && data.length > 0) return data as Message[]

  const seeded = [
    {
      id: crypto.randomUUID(),
      user_id: user.id,
      sender_name: 'Aarav Mehta',
      sender_handle: '@aarav',
      recipient_name: 'You',
      recipient_email: '',
      direction: 'inbound',
      source_language: 'English',
      body: 'The launch plan is ready. Let\u2019s review it together tomorrow morning.',
      translated_body: null,
      created_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user_id: user.id,
      sender_name: 'Priya Sharma',
      sender_handle: '@priya',
      recipient_name: 'You',
      recipient_email: '',
      direction: 'inbound',
      source_language: 'Hindi',
      body: '\u0906\u091c \u0915\u0940 \u092c\u0948\u0920\u0915 \u0915\u0947 \u092c\u093e\u0926 \u092e\u0948\u0902 \u0906\u092a\u0915\u094b \u0905\u0917\u0932\u0947 \u091a\u0930\u0923 \u092d\u0947\u091c \u0926\u0942\u0902\u0917\u0940\u0964',
      translated_body: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  const { error: insertError } = await supabase.from('message').insert(seeded)
  if (insertError) throw new Error('Failed to seed messages')
  return seeded as Message[]
}

export async function sendMessage(input: {
  recipientName: string
  recipientEmail: string
  text: string
  sourceLanguage: string
  targetLanguage: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const text = input.text.trim()
  if (!input.recipientName.trim() || !input.recipientEmail.trim() || !text) {
    throw new Error('Complete all message fields')
  }

  const translated = await translateText(text, input.targetLanguage)
  const userName = (user.user_metadata as { name?: string })?.name || 'You'

  const row = {
    id: crypto.randomUUID(),
    user_id: user.id,
    sender_name: userName,
    sender_handle: '@you',
    recipient_name: input.recipientName.trim(),
    recipient_email: input.recipientEmail.trim(),
    direction: 'outbound',
    source_language: input.sourceLanguage,
    body: text,
    translated_body: translated,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('message').insert(row).select().single()
  if (error) throw new Error('Failed to send message')
  return data as Message
}
