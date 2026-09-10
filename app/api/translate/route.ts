import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const text = typeof payload.text === 'string' ? payload.text.trim() : ''
    const targetLanguage = typeof payload.targetLanguage === 'string' ? payload.targetLanguage.trim() : ''
    if (!text || !targetLanguage) return NextResponse.json({ error: 'Enter a message and choose a language.' }, { status: 400 })
    const sourceLanguage = typeof payload.sourceLanguage === 'string' ? payload.sourceLanguage.trim() : 'auto'
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLanguage === 'auto' ? 'autodetect' : sourceLanguage}|${targetLanguage}`,
      mt: '1',
    })
    const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return NextResponse.json({ error: 'The free translation service is unavailable right now.' }, { status: 502 })
    const result = (await response.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
    const translation = result.responseData?.translatedText?.trim()
    if (!translation || result.responseStatus !== 200) return NextResponse.json({ error: 'The translation was empty. Try again.' }, { status: 502 })
    return NextResponse.json({ translation, provider: 'MyMemory' })
  } catch (error) {
    console.error('[v0] Translation failed', error)
    return NextResponse.json({ error: 'Translation unavailable right now. Please try again.' }, { status: 502 })
  }
}
