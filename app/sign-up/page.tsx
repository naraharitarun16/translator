import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignUpPage() { return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">POLYGLOT / 01</p><h1>Find your language.</h1><p className="auth-copy">Create an inbox that meets people where they are.</p><AuthForm mode="sign-up" /><p className="auth-switch">Already have an account? <Link href="/sign-in">Log in</Link></p></section></main> }
