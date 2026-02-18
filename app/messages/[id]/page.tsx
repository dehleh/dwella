'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AppShell } from '@/components/AppShell'
import { ArrowLeft, Send, Shield, Flag, Ban, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  senderUserId: string
  messageType: string
  body: string | null
  mediaUrl: string | null
  createdAt: string
}

interface ConversationDetail {
  id: string
  status: string
  listing: {
    id: string
    neighborhood: string
    city: string
    priceMonthly: number
    roomType: string
    hostUserId: string
  }
  host: { id: string; profile: { displayName: string } | null }
  seeker: { id: string; profile: { displayName: string } | null }
  messages: Message[]
}

export default function ChatPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [convo, setConvo] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const user = session?.user as any

  useEffect(() => {
    fetchConversation()
    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(fetchConversation, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convo?.messages])

  async function fetchConversation() {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setConvo(data)
      }
    } catch { /* empty */ } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageText.trim() }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setConvo((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
        )
        setMessageText('')
        if (newMsg.safetyWarning) {
          alert(newMsg.safetyWarning)
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to send message')
      }
    } catch { /* empty */ } finally {
      setSending(false)
    }
  }

  async function handleBlock() {
    if (!confirm('Are you sure you want to block this user? This will close the conversation.')) return
    try {
      const res = await fetch(`/api/conversations/${id}/block`, { method: 'POST' })
      if (res.ok) {
        router.push('/messages')
      }
    } catch { /* empty */ }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-8">
          <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!convo) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-16 text-center">
          <h2 className="text-xl font-bold">Conversation not found</h2>
        </div>
      </AppShell>
    )
  }

  const otherUser = convo.host.id === user?.id ? convo.seeker : convo.host

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </Link>
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold">
              {otherUser.profile?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{otherUser.profile?.displayName || 'User'}</p>
              <Link
                href={`/listings/${convo.listing.id}`}
                className="text-xs text-gray-500 hover:text-brand-600"
              >
                {convo.listing.neighborhood} — ₦{convo.listing.priceMonthly.toLocaleString()}/mo
              </Link>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              •••
            </button>
            {showActions && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-10">
                <Link
                  href={`/reports/new?type=user&id=${otherUser.id}&conversationId=${convo.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Flag size={14} /> Report User
                </Link>
                <button
                  onClick={handleBlock}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Ban size={14} /> Block User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Safety Banner */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-xs text-blue-700">
          <Shield size={14} className="flex-shrink-0" />
          <span>Never pay or share financial details outside Dwella. Report suspicious behavior.</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
          {convo.messages.length === 0 && (
            <div className="text-center py-8">
              <Info size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Start the conversation. Be respectful and safe.</p>
            </div>
          )}
          {convo.messages.map((msg) => {
            const isMine = msg.senderUserId === user?.id
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-brand-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.body && <p>{msg.body}</p>}
                  {msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="Attachment" className="max-w-full rounded-lg mt-1" />
                  )}
                  <p className={`text-xs mt-1 ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {convo.status === 'ACTIVE' ? (
          <form onSubmit={sendMessage} className="flex items-center gap-2 bg-white px-4 py-3 border-t border-gray-200 rounded-b-xl">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="p-2.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-gray-100 px-4 py-3 text-gray-500 text-sm border-t">
            <AlertTriangle size={16} /> This conversation has been closed.
          </div>
        )}
      </div>
    </AppShell>
  )
}
