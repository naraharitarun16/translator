'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const result = mode === 'sign-up' ? await authClient.signUp.email({ email, password, name }) : await authClient.signIn.email({ email, password }); setLoading(false); if (result.error) { setError('We could not complete that request. Check your details and try again.'); return }; router.push('/'); router.refresh() }
  return <form className="auth-form" onSubmit={submit}>{mode === 'sign-up' && <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Log in'}</button></form>
}
