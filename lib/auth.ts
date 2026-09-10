import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const originValues = [process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter((value): value is string => Boolean(value))
const productionOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].filter((value): value is string => Boolean(value)).map((value) => value.startsWith('http') ? value : `https://${value}`)
const baseURL = process.env.BETTER_AUTH_URL || productionOrigins[0] || process.env.V0_RUNTIME_URL || 'http://localhost:3000'

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins: ['http://localhost:3000', ...originValues, ...productionOrigins],
  emailAndPassword: { enabled: true },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
