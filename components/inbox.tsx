'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Search,
  Plus,
  LogOut,
  Languages,
  Sparkles,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { sendMessage } from '@/app/actions/messages'
import type { Message } from '@/lib/db/schema'

const languages = ['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'Tamil', 'German']

type Conversation = {
  id: string
  name: string
  handle: string
  avatar: string
  isOutbound: boolean
  lastMessage: string
  sourceLanguage: string
  messages: ConversationMessage[]
}

type ConversationMessage = {
  id: string
  text: string
  translatedText: string | null
  isOutbound: boolean
  sourceLanguage: string
  createdAt: Date
}

function buildConversations(messages: Message[]): Conversation[] {
  const groups = new Map<string, Conversation>()
  for (const msg of messages) {
    const key = msg.direction === 'outbound' ? msg.recipientEmail : msg.senderHandle
    const existing = groups.get(key)
    const cm: ConversationMessage = {
      id: msg.id,
      text: msg.body,
      translatedText: msg.translatedBody,
      isOutbound: msg.direction === 'outbound',
      sourceLanguage: msg.sourceLanguage,
      createdAt: msg.createdAt,
    }
    if (existing) {
      existing.messages.push(cm)
      if (cm.createdAt > existing.messages[existing.messages.length - 2].createdAt) {
        existing.lastMessage = cm.translatedText || cm.text
        existing.sourceLanguage = cm.sourceLanguage
      }
    } else {
      groups.set(key, {
        id: key,
        name: msg.direction === 'outbound' ? msg.recipientName : msg.senderName,
        handle: msg.direction === 'outbound' ? msg.recipientEmail : msg.senderHandle,
        avatar: msg.direction === 'outbound' ? msg.recipientName.charAt(0) : msg.senderName.charAt(0),
        isOutbound: msg.direction === 'outbound',
        lastMessage: cm.translatedText || cm.text,
        sourceLanguage: cm.sourceLanguage,
        messages: [cm],
      })
    }
  }
  return Array.from(groups.values()).sort((a, b) => {
    const aTime = a.messages[a.messages.length - 1].createdAt.getTime()
    const bTime = b.messages[b.messages.length - 1].createdAt.getTime()
    return bTime - aTime
  })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(date: Date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const avatarColors = [
  ['#2b8a3e', '#d4f4dd'],
  ['#1971c2', '#d0e2ff'],
  ['#e8590c', '#ffe8cc'],
  ['#9c36b5', '#f3d9ff'],
  ['#c92a2a', '#ffe0e0'],
  ['#0c8599', '#c5f6fa'],
  ['#5f3dc4', '#e5dbff'],
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export function Inbox({ messages: initialMessages, userName }: { messages: Message[]; userName: string }) {
  const [messages, setMessages] = useState(initialMessages)
  const [conversations] = useState(() => buildConversations(initialMessages))
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('English')
  const [targetLanguage, setTargetLanguage] = useState('Hindi')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [translating, setTranslating] = useState<string | null>(null)
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, mobileShowChat])

  const filtered = conversations.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase())
  )

  async function handleTranslate(msgId: string, text: string, target: string) {
    setTranslating(msgId)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: target }),
      })
      const data = await res.json()
      if (!res.ok || !data.translation) throw new Error(data.error || 'Translation failed')
      setTranslatedMap((m) => ({ ...m, [msgId]: data.translation }))
    } catch {
      setError('Translation failed. Try again.')
    } finally {
      setTranslating(null)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    setError('')
    try {
      const msg = await sendMessage({
        recipientName,
        recipientEmail,
        text: draft,
        sourceLanguage,
        targetLanguage,
      })
      setMessages((cur) => [...cur, msg])
      const newCm: ConversationMessage = {
        id: msg.id,
        text: msg.body,
        translatedText: msg.translatedBody,
        isOutbound: true,
        sourceLanguage: msg.sourceLanguage,
        createdAt: msg.createdAt,
      }
      const existing = conversations.find((c) => c.id === recipientEmail)
      if (existing) {
        existing.messages.push(newCm)
        existing.lastMessage = newCm.translatedText || newCm.text
      } else {
        conversations.unshift({
          id: recipientEmail,
          name: recipientName,
          handle: recipientEmail,
          avatar: recipientName.charAt(0),
          isOutbound: true,
          lastMessage: newCm.translatedText || newCm.text,
          sourceLanguage: newCm.sourceLanguage,
          messages: [newCm],
        })
        setActiveId(recipientEmail)
      }
      setDraft('')
      setRecipientName('')
      setRecipientEmail('')
      setShowNewChat(false)
      setMobileShowChat(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="tg-app">
      {/* Sidebar */}
      <aside className={`tg-sidebar ${mobileShowChat ? 'tg-sidebar--hidden' : ''}`}>
        <header className="tg-sidebar-header">
          <div className="tg-menu-btn" aria-label="Menu">
            <MoreVertical size={20} />
          </div>
          <div className="tg-search-wrap">
            <Search size={18} className="tg-search-icon" />
            <input
              className="tg-search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="tg-conversation-list">
          {filtered.map((convo) => {
            const [bg, fg] = getAvatarColor(convo.name)
            const lastMsg = convo.messages[convo.messages.length - 1]
            return (
              <button
                key={convo.id}
                className={`tg-conversation ${active?.id === convo.id ? 'tg-conversation--active' : ''}`}
                onClick={() => {
                  setActiveId(convo.id)
                  setMobileShowChat(true)
                }}
              >
                <div className="tg-avatar" style={{ background: fg, color: bg }}>
                  {convo.avatar.toUpperCase()}
                </div>
                <div className="tg-convo-body">
                  <div className="tg-convo-top-row">
                    <span className="tg-convo-name">{convo.name}</span>
                    <span className="tg-convo-time">{formatTime(lastMsg.createdAt)}</span>
                  </div>
                  <div className="tg-convo-bottom-row">
                    <span className="tg-convo-preview">
                      {convo.isOutbound && <CheckCheck size={14} className="tg-check-icon" />}
                      {convo.lastMessage}
                    </span>
                    <span className="tg-lang-badge">{convo.sourceLanguage}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button className="tg-fab" aria-label="New chat" onClick={() => setShowNewChat(true)}>
          <Plus size={24} />
        </button>
      </aside>

      {/* Chat panel */}
      <main className={`tg-chat ${mobileShowChat ? '' : 'tg-chat--hidden'}`}>
        {active ? (
          <>
            <header className="tg-chat-header">
              <button className="tg-back-btn" aria-label="Back" onClick={() => setMobileShowChat(false)}>
                <ArrowLeft size={22} />
              </button>
              <div className="tg-chat-header-info">
                <div className="tg-avatar tg-avatar--sm" style={{ background: getAvatarColor(active.name)[1], color: getAvatarColor(active.name)[0] }}>
                  {active.avatar.toUpperCase()}
                </div>
                <div>
                  <h2 className="tg-chat-name">{active.name}</h2>
                  <span className="tg-chat-status">{active.handle}</span>
                </div>
              </div>
              <div className="tg-chat-actions">
                <button className="tg-icon-btn" aria-label="Call"><Phone size={19} /></button>
                <button className="tg-icon-btn" aria-label="Video"><Video size={19} /></button>
                <button className="tg-icon-btn" aria-label="More"><MoreVertical size={19} /></button>
              </div>
            </header>

            <div className="tg-messages">
              {active.messages.map((msg, idx) => {
                const showDate =
                  idx === 0 || formatDay(msg.createdAt) !== formatDay(active.messages[idx - 1].createdAt)
                return (
                  <div key={msg.id}>
                    {showDate && <div className="tg-date-sep"><span>{formatDay(msg.createdAt)}</span></div>}
                    <div className={`tg-bubble-wrap ${msg.isOutbound ? 'tg-bubble-wrap--out' : ''}`}>
                      <div className={`tg-bubble ${msg.isOutbound ? 'tg-bubble--out' : 'tg-bubble--in'}`}>
                        <p className="tg-bubble-text">{translatedMap[msg.id] || msg.translatedText || msg.text}</p>
                        <div className="tg-bubble-meta">
                          <span className="tg-bubble-lang">{msg.sourceLanguage}</span>
                          <span className="tg-bubble-time">{formatTime(msg.createdAt)}</span>
                          {msg.isOutbound && <CheckCheck size={14} className="tg-check-icon" />}
                        </div>
                        {!msg.isOutbound && !translatedMap[msg.id] && !msg.translatedText && (
                          <button
                            className="tg-translate-link"
                            onClick={() => handleTranslate(msg.id, msg.text, 'English')}
                            disabled={translating === msg.id}
                          >
                            {translating === msg.id ? (
                              <><Sparkles size={12} /> Translating…</>
                            ) : (
                              <><Languages size={12} /> Translate to English</>
                            )}
                          </button>
                        )}
                        {!msg.isOutbound && translatedMap[msg.id] && (
                          <div className="tg-original-text">
                            <Sparkles size={11} /> Original: {msg.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="tg-composer" onSubmit={handleSend}>
              <button type="button" className="tg-composer-btn" aria-label="Attach"><Paperclip size={22} /></button>
              <input
                className="tg-composer-input"
                placeholder="Message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="button" className="tg-composer-btn" aria-label="Emoji"><Smile size={22} /></button>
              <button type="submit" className="tg-send-btn" disabled={!draft.trim() || sending} aria-label="Send">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="tg-empty">
            <div className="tg-empty-icon"><Sparkles size={40} /></div>
            <h2>Polyglot</h2>
            <p>Select a conversation or start a new chat</p>
            <button className="tg-start-btn" onClick={() => setShowNewChat(true)}>
              <Plus size={18} /> New Chat
            </button>
          </div>
        )}
      </main>

      {/* New chat modal */}
      {showNewChat && (
        <div className="tg-modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="tg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h3>New Message</h3>
              <button className="tg-modal-close" onClick={() => setShowNewChat(false)}><ArrowLeft size={20} /></button>
            </div>
            <form className="tg-new-chat-form" onSubmit={handleSend}>
              <label className="tg-field">
                <span>Recipient name</span>
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required placeholder="Jane Doe" />
              </label>
              <label className="tg-field">
                <span>Recipient email</span>
                <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} required placeholder="jane@example.com" />
              </label>
              <div className="tg-field-row">
                <label className="tg-field">
                  <span>Your language</span>
                  <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                    {languages.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </label>
                <label className="tg-field">
                  <span>Translate to</span>
                  <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
                    {languages.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </label>
              </div>
              <label className="tg-field">
                <span>Message</span>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} required placeholder="Write your message…" rows={4} />
              </label>
              {error && <p className="tg-error" role="alert">{error}</p>}
              <button type="submit" className="tg-send-chat-btn" disabled={sending}>
                {sending ? 'Translating & sending…' : 'Translate & Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User menu floating */}
      <div className="tg-user-float">
        <span className="tg-user-name">{userName}</span>
        <button className="tg-icon-btn" aria-label="Log out" onClick={() => authClient.signOut().then(() => (location.href = '/sign-in'))}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
