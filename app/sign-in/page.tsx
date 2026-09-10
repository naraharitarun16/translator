import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() { return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">POLYGLOT / 01</p><h1>Welcome back.</h1><p className="auth-copy">Your conversations, translated naturally.</p><AuthForm mode="sign-in" /><p className="auth-switch">New to Polyglot? <Link href="/sign-up">Create an account</Link></p></section></main> }
