import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnv(primary: string, fallback: string): string {
  const value = process.env[primary] || process.env[fallback]
  if (!value) {
    console.error(`[supabase] Missing environment variable: ${primary} (or fallback ${fallback})`)
    return ''
  }
  return value
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
}
