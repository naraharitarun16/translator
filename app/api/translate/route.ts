import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json()
    if (typeof text !== 'string' || !text.trim() || typeof targetLanguage !== 'string') return NextResponse.json({ error: 'Invalid translation request' }, { status: 400 })
    const result = await generateText({ model: 'openai/gpt-4.1-mini', system: 'You are a precise translation engine. Return only the translated text, with no quotes, notes, or explanation.', prompt: `Translate this message into ${targetLanguage}:\n\n${text}` })
    return NextResponse.json({ translation: result.text })
  } catch (error) {
    console.error('[v0] Translation failed', error)
    return NextResponse.json({ error: 'Translation unavailable right now' }, { status: 500 })
  }
}
