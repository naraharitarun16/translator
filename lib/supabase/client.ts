import { createBrowserClient } from '@supabase/ssr'

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`[supabase] Missing environment variable: ${name}`)
    return ''
  }
  return value
}

export function createClient() {
  return createBrowserClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
