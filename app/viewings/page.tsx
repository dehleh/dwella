'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Viewing {
  id: string
  listingId: string
  status: string
  proposedSlots: string[]
  confirmedSlot: string | null
  notes: string | null
  createdAt: string
  listing: {
    id: string
    neighborhood: string
    city: string
    priceMonthly: number
    roomType: string
  }
  host: { id: string; profile?: { displayName: string } }
  seeker: { id: string; profile?: { displayName: string } }
}

const statusColors: Record<string, string> = {
  PROPOSED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-red-100 text-red-800',
}

export default function ViewingsPage() {
  const { data: session } = useSession()
  const [viewings, setViewings] = useState<Viewing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED'>('all')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')

  const userId = (session?.user as any)?.id

  useEffect(() => {
    if (!session) return
    fetchViewings()
  }, [session])

  const fetchViewings = async () => {
    try {
      const res = await fetch('/api/viewings')
      if (res.ok) {
        const data = await res.json()
        setViewings(data.viewings)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (viewingId: string) => {
    if (!selectedSlot) return
    try {
      const res = await fetch(`/api/viewings/${viewingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedSlot: selectedSlot }),
      })
      if (res.ok) {
        setConfirmingId(null)
        setSelectedSlot('')
        fetchViewings()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancel = async (viewingId: string) => {
    if (!confirm('Cancel this viewing?')) return
    try {
      const res = await fetch(`/api/viewings/${viewingId}/cancel`, { method: 'POST' })
      if (res.ok) fetchViewings()
    } catch (err) {
      console.error(err)
    }
  }

  const handleComplete = async (viewingId: string, outcome: 'COMPLETED' | 'NO_SHOW') => {
    try {
      const res = await fetch(`/api/viewings/${viewingId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      })
      if (res.ok) fetchViewings()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = filter === 'all' ? viewings : viewings.filter(v => v.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-brand-500" />
          Viewings
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'PROPOSED', 'CONFIRMED', 'COMPLETED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === f ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No viewings yet</p>
          <p className="text-sm text-gray-400 mt-1">Browse listings to schedule a viewing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(viewing => {
            const isHost = viewing.host.id === userId
            const otherParty = isHost ? viewing.seeker : viewing.host
            const otherName = otherParty.profile?.displayName || 'Unknown'

            return (
              <div key={viewing.id} className="bg-white rounded-xl border p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{viewing.listing.neighborhood}, {viewing.listing.city}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {viewing.listing.roomType} · ₦{viewing.listing.priceMonthly.toLocaleString()}/mo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isHost ? 'Seeker' : 'Host'}: {otherName}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[viewing.status] || 'bg-gray-100'}`}>
                    {viewing.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Confirmed slot */}
                {viewing.confirmedSlot && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Confirmed: {format(new Date(viewing.confirmedSlot), 'PPPp')}
                    </span>
                  </div>
                )}

                {/* Proposed slots (for PROPOSED status) */}
                {viewing.status === 'PROPOSED' && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Proposed times:</p>
                    <div className="flex flex-wrap gap-2">
                      {viewing.proposedSlots.map((slot, i) => (
                        <span key={i} className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg text-sm">
                          <Clock className="h-3 w-3" />
                          {format(new Date(slot), 'PPPp')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewing.notes && (
                  <p className="text-sm text-gray-500 italic">&quot;{viewing.notes}&quot;</p>
                )}

                {/* Host actions for PROPOSED viewings */}
                {isHost && viewing.status === 'PROPOSED' && (
                  <div className="pt-2 border-t space-y-3">
                    {confirmingId === viewing.id ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Select a time slot to confirm:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewing.proposedSlots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                                selectedSlot === slot
                                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {format(new Date(slot), 'PPPp')}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(viewing.id)}
                            disabled={!selectedSlot}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setConfirmingId(null); setSelectedSlot('') }}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmingId(viewing.id)}
                          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                        >
                          Confirm a Slot
                        </button>
                        <button
                          onClick={() => handleCancel(viewing.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Seeker cancel for PROPOSED */}
                {!isHost && viewing.status === 'PROPOSED' && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => handleCancel(viewing.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}

                {/* Both parties cancel for CONFIRMED */}
                {viewing.status === 'CONFIRMED' && (
                  <div className="pt-2 border-t flex gap-2">
                    {isHost && (
                      <>
                        <button
                          onClick={() => handleComplete(viewing.id, 'COMPLETED')}
                          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                        >
                          <Eye className="h-3 w-3 inline mr-1" /> Mark Completed
                        </button>
                        <button
                          onClick={() => handleComplete(viewing.id, 'NO_SHOW')}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                        >
                          No Show
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCancel(viewing.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
