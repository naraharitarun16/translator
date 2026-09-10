import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const text = typeof payload.text === 'string' ? payload.text.trim() : ''
    const targetLanguage = typeof payload.targetLanguage === 'string' ? payload.targetLanguage.trim() : ''
    if (!text || !targetLanguage) return NextResponse.json({ error: 'Enter a message and choose a language.' }, { status: 400 })
    const result = await generateText({
      model: 'openai/gpt-4.1-mini',
      system: 'You are a precise translation engine. Return only the translated text, with no quotes, notes, or explanation.',
      prompt: `Translate this message into ${targetLanguage}. Preserve the meaning and tone.\n\n${text}`,
    })
    const translation = result.text.trim()
    if (!translation) return NextResponse.json({ error: 'The translation was empty. Try again.' }, { status: 502 })
    return NextResponse.json({ translation })
  } catch (error) {
    console.error('[v0] Translation failed', error)
    return NextResponse.json({ error: 'Translation unavailable right now. Check the AI Gateway configuration and try again.' }, { status: 500 })
  }
}
