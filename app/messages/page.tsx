'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MessageSquare, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ConversationSummary {
  id: string
  listing: {
    id: string
    neighborhood: string
    city: string
    priceMonthly: number
    roomType: string
  }
  host: { id: string; profile: { displayName: string } | null }
  seeker: { id: string; profile: { displayName: string } | null }
  messages: { body: string | null; createdAt: string; senderUserId: string }[]
  updatedAt: string
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const user = session?.user as any

  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch { /* empty */ } finally {
      setLoading(false)
    }
  }

  return (
      <div className="max-w-3xl mx-auto py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((convo) => {
              const otherUser = convo.host.id === user?.id ? convo.seeker : convo.host
              const lastMessage = convo.messages[0]
              return (
                <button
                  key={convo.id}
                  onClick={() => router.push(`/messages/${convo.id}`)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                    {otherUser.profile?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">
                        {otherUser.profile?.displayName || 'User'}
                      </p>
                      {lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <MapPin size={12} /> {convo.listing.neighborhood}, {convo.listing.city}
                      — ₦{convo.listing.priceMonthly.toLocaleString()}/mo
                    </p>
                    {lastMessage?.body && (
                      <p className="text-sm text-gray-600 truncate mt-0.5">{lastMessage.body}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-gray-500">Start browsing listings and message hosts you're interested in.</p>
          </div>
        )}
      </div>
  )
}
