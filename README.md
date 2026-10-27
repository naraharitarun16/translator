# Polyglot

A multilingual chat app that translates messages in real time. Sign in, start a conversation in your own language, and your recipient reads it in theirs — incoming messages can be translated on demand with a single tap.

Built with [Next.js](https://nextjs.org) + [Supabase](https://supabase.com), styled with [Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com).

## Features

- **Email/password authentication** powered by Supabase Auth, with protected routes via middleware.
- **Inbox UI** — a Telegram-style two-panel layout (conversation list + chat panel) that collapses to a single panel on mobile.
- **Real-time translation** — outgoing messages are translated before they're saved; incoming messages can be translated on demand into English (or your chosen language).
- **7 languages supported** — English, Hindi, Spanish, French, Japanese, Tamil, and German.
- **New chat modal** — pick a recipient, choose your source and target languages, write a message, and send it already translated.
- **Per-user message storage** — each signed-in user only ever sees their own conversations (enforced by Supabase Row Level Security).

## Tech Stack

| Layer        | Technology                                                        |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router, React Server Components)                 |
| Language     | TypeScript 5.7                                                   |
| Styling      | Tailwind CSS v4 + shadcn/ui + lucide-react icons                 |
| Auth & DB    | Supabase (Postgres, Auth, RLS) via `@supabase/ssr`               |
| Translation  | MyMemory Translation API (free tier) through a Next.js route    |
| Deployment   | Netlify (`@netlify/plugin-nextjs`)                               |

## Getting Started

Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to sign in. Create an account at `/sign-up`, then you'll land in the inbox with a couple of seeded sample conversations.

### Environment variables

Create a local `.env.local` file with these variables from your Supabase project (Project Settings → API):
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```
Do not commit `.env`, `.env.local`, service-role keys, or other secrets. Apply the SQL migration in `supabase/migrations/` to your Supabase database before using messaging.

## Project Structure

```
app/
  page.tsx              # Protected inbox — redirects to /sign-in if logged out
  sign-in/              # Sign-in page
  sign-up/              # Sign-up page
  actions/messages.ts   # Server actions: load & send messages (with translation)
  api/translate/route.ts# On-demand translation endpoint for incoming messages
components/
  inbox.tsx             # Main chat UI (conversation list + message panel)
  auth-form.tsx         # Shared sign-in / sign-up form
  ui/                   # shadcn/ui primitives
lib/
  supabase/             # Supabase client (server, client, middleware)
  utils.ts              # cn() helper for class merging
supabase/
  migrations/           # SQL migrations (messages table + RLS policies)
middleware.ts           # Refreshes Supabase session on every request
```

## Data Model

A single `message` table stores every message (inbound and outbound) per user:

- `id`, `user_id` (owner, from `auth.users`)
- `sender_name`, `sender_handle`, `recipient_name`, `recipient_email`
- `direction` — `inbound` or `outbound`
- `source_language`, `body` (original), `translated_body` (nullable)
- `created_at`

Row Level Security is enabled with one policy per CRUD verb, scoped to `auth.uid() = user_id` — users can only read, insert, update, and delete their own messages.

## Translation Flow

1. **Sending** — the `sendMessage` server action calls MyMemory to translate your text into the target language before inserting the row. Both the original `body` and the `translated_body` are stored.
2. **Receiving** — incoming messages render with a "Translate to English" link. Clicking it hits `/api/translate`, which returns the translation and reveals the original text beneath.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
