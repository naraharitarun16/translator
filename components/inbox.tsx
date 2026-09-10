'use client'

import { useState } from 'react'
import { Languages, LogOut, MessageCircle, Send, Sparkles } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { sendMessage } from '@/app/actions/messages'
import type { Message } from '@/lib/db/schema'

const languages = ['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'Tamil', 'German']

export function Inbox({ messages: initialMessages, userName }: { messages: Message[]; userName: string }) {
  const [messages, setMessages] = useState(initialMessages)
  const [selected, setSelected] = useState(initialMessages[0]?.id ?? '')
  const [language, setLanguage] = useState('English')
  const [translated, setTranslated] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('English')
  const [targetLanguage, setTargetLanguage] = useState('Hindi')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const active = messages.find((message) => message.id === selected) ?? messages[0]

  async function translate() {
    if (!active) return
    if (language === active.sourceLanguage) {
      setTranslated((current) => ({ ...current, [active.id]: active.body }))
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: active.body, targetLanguage: language }) })
      const data = await response.json()
      if (!response.ok || !data.translation) throw new Error(data.error || 'Translation failed')
      setTranslated((current) => ({ ...current, [active.id]: data.translation }))
    } catch (translationError) {
      setError(translationError instanceof Error ? translationError.message : 'Translation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const message = await sendMessage({ recipientName, recipientEmail, text: draft, sourceLanguage, targetLanguage })
      setMessages((current) => [message, ...current])
      setSelected(message.id)
      setDraft('')
      setRecipientName('')
      setRecipientEmail('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  return <main className="inbox-shell"><header className="app-header"><div className="brand-mark"><span className="brand-dot" />polyglot</div><div className="header-actions"><span className="user-greeting">{userName}</span><button className="icon-button" aria-label="Log out" onClick={() => authClient.signOut().then(() => location.href = '/sign-in')}><LogOut size={17} /></button></div></header><div className="inbox-layout"><aside className="conversation-list"><div className="section-label"><span>MESSAGES</span><span>{messages.length}</span></div>{messages.map((message) => <button key={message.id} className={`conversation ${active?.id === message.id ? 'active' : ''}`} onClick={() => { setSelected(message.id); setError('') }}><span className="avatar">{message.direction === 'outbound' ? '→' : message.senderName.charAt(0)}</span><span className="conversation-copy"><strong>{message.direction === 'outbound' ? `To ${message.recipientName}` : message.senderName}</strong><small>{message.translatedBody || message.body}</small></span><span className="language-pill">{message.direction === 'outbound' ? message.sourceLanguage : message.sourceLanguage}</span></button>)}</aside><section className="message-panel">{active ? <><div className="message-header"><div><p className="eyebrow">MESSAGE / {active.sourceLanguage.toUpperCase()}</p><h1>{active.direction === 'outbound' ? `To ${active.recipientName}` : active.senderName}</h1><p className="handle">{active.direction === 'outbound' ? active.recipientEmail : active.senderHandle} · {new Date(active.createdAt).toLocaleDateString()}</p></div><span className="message-index">{String(messages.indexOf(active) + 1).padStart(2, '0')}</span></div><article className="message-card"><div className="message-meta"><span><MessageCircle size={16} /> {active.direction === 'outbound' ? 'Sent message' : 'Incoming message'}</span><span>{active.sourceLanguage}</span></div><p className="message-body">{translated[active.id] || active.translatedBody || active.body}</p>{(translated[active.id] || active.translatedBody) && <p className="translated-note"><Sparkles size={14} /> {active.direction === 'outbound' ? `Delivered in ${targetLanguage}` : `Translated to ${language}`}</p>}</article>{active.direction === 'inbound' && <div className="translate-bar"><div className="language-control"><Languages size={18} /><label htmlFor="language">Translate to</label><select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></div><button className="primary-button" onClick={translate} disabled={loading}>{loading ? 'Translating…' : 'Translate message'}</button></div>}</> : <div className="empty-state">Your inbox is ready for its first message.</div>}<form className="composer" onSubmit={handleSend}><div className="composer-heading"><div><p className="eyebrow">NEW MESSAGE</p><h2>Send in their language.</h2></div><Send size={20} /></div><div className="composer-grid"><input aria-label="Recipient name" placeholder="Recipient name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} required /><input aria-label="Recipient email" type="email" placeholder="Recipient email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} required /><select aria-label="Your language" value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Recipient language" value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></div><textarea aria-label="Message" placeholder="Write your message…" value={draft} onChange={(event) => setDraft(event.target.value)} required /><button className="send-button" type="submit" disabled={sending}>{sending ? 'Translating and sending…' : 'Translate & send'} <Send size={16} /></button></form>{error && <p className="error-message" role="alert">{error}</p>}</section></div></main>
}
