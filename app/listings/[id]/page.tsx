'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AppShell } from '@/components/AppShell'
import {
  MapPin, DollarSign, Calendar, Home, Shield, MessageSquare,
  Eye, Clock, CheckCircle, Ban, Users, Cigarette, Dog, Volume2,
  ChefHat, ArrowLeft, Flag, Heart
} from 'lucide-react'
import Link from 'next/link'

interface ListingDetail {
  id: string
  city: string
  neighborhood: string
  priceMonthly: number
  deposit: number | null
  roomType: string
  furnished: boolean
  utilitiesIncluded: boolean
  minStayMonths: number
  availableFrom: string
  rules: any
  photos: string[]
  status: string
  createdAt: string
  host: {
    id: string
    profile: { displayName: string; bio: string; photos: any[]; occupation: string } | null
    verified: boolean
  }
  matchScore?: number
  matchReasons?: string[]
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const user = session?.user as any

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`)
        if (res.ok) {
          const data = await res.json()
          setListing(data)
        }
      } catch { /* empty */ } finally {
        setLoading(false)
      }
    }
    if (id) fetchListing()
  }, [id])

  async function startConversation() {
    if (!listing) return
    setChatLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/messages/${data.id}`)
      } else {
        const err = await res.json()
        if (err.conversationId) {
          router.push(`/messages/${err.conversationId}`)
        } else {
          alert(err.error || 'Failed to start conversation')
        }
      }
    } catch {
      alert('Failed to start conversation')
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-8 space-y-4">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!listing) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <h2 className="text-xl font-bold text-gray-900">Listing not found</h2>
          <Link href="/listings" className="text-brand-600 hover:underline mt-2 inline-block">Browse all listings</Link>
        </div>
      </AppShell>
    )
  }

  const roomTypeLabel = listing.roomType === 'ENSUITE' ? 'Ensuite' : listing.roomType === 'SHARED_BATH' ? 'Shared Bath' : 'Studio Room'
  const rules = listing.rules || {}

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Back Button */}
        <Link href="/listings" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft size={16} /> Back to listings
        </Link>

        {/* Photo Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {(listing.photos as string[]).length > 0 ? (
            (listing.photos as string[]).slice(0, 4).map((url, i) => (
              <div key={i} className={`bg-gray-200 ${i === 0 ? 'md:row-span-2 h-64 md:h-full' : 'h-32 md:h-48'}`}>
                <img src={url} alt={`Room photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="h-64 md:col-span-2 bg-gray-100 flex items-center justify-center rounded-xl">
              <Home size={48} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  listing.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  listing.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {listing.status}
                </span>
                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">
                  {roomTypeLabel}
                </span>
                {listing.furnished && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Furnished
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{roomTypeLabel} in {listing.neighborhood}</h1>
              <p className="flex items-center gap-1 text-gray-600 mt-1">
                <MapPin size={16} /> {listing.neighborhood}, {listing.city}
              </p>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailCard icon={<DollarSign size={18} />} label="Monthly Rent" value={`₦${listing.priceMonthly.toLocaleString()}`} />
              {listing.deposit && <DetailCard icon={<DollarSign size={18} />} label="Deposit" value={`₦${listing.deposit.toLocaleString()}`} />}
              <DetailCard icon={<Calendar size={18} />} label="Available From" value={new Date(listing.availableFrom).toLocaleDateString()} />
              <DetailCard icon={<Clock size={18} />} label="Min Stay" value={`${listing.minStayMonths} months`} />
              <DetailCard icon={<Home size={18} />} label="Utilities" value={listing.utilitiesIncluded ? 'Included' : 'Not included'} />
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">House Rules</h3>
              <div className="grid grid-cols-2 gap-3">
                <RuleItem icon={<Users size={16} />} label="Guests" value={rules.guests?.replace('_', ' ') || '—'} />
                <RuleItem icon={<Volume2 size={16} />} label="Quiet Hours" value={rules.quietHours === 'flexible' ? 'Flexible' : `From ${rules.quietHours}` || '—'} />
                <RuleItem icon={<Cigarette size={16} />} label="Smoking" value={rules.smoking?.replace('_', ' ') || '—'} />
                <RuleItem icon={<Dog size={16} />} label="Pets" value={rules.pets?.replace('_', ' ') || '—'} />
              </div>
            </div>

            {/* Match Score */}
            {listing.matchScore !== undefined && listing.matchScore > 0 && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-brand-900">Match Score</h3>
                  <span className="text-2xl font-bold text-brand-600">{listing.matchScore}%</span>
                </div>
                {listing.matchReasons && listing.matchReasons.length > 0 && (
                  <div>
                    <p className="text-sm text-brand-700 mb-2">Top reasons you match:</p>
                    <ul className="space-y-1">
                      {listing.matchReasons.map((reason, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-brand-800">
                          <CheckCircle size={14} className="text-brand-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Host Info + Actions */}
          <div className="space-y-4">
            {/* Host Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-700 text-sm mb-3">Hosted by</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold">
                  {listing.host.profile?.displayName?.[0]?.toUpperCase() || 'H'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{listing.host.profile?.displayName || 'Host'}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {listing.host.verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Shield size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-gray-400">Not verified</span>
                    )}
                  </div>
                </div>
              </div>
              {listing.host.profile?.bio && (
                <p className="text-sm text-gray-600">{listing.host.profile.bio}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user?.id !== listing.host.id && (
                <>
                  <button
                    onClick={startConversation}
                    disabled={chatLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-60"
                  >
                    <MessageSquare size={18} />
                    {chatLoading ? 'Starting...' : 'Message Host'}
                  </button>

                  <button
                    onClick={() => router.push(`/listings/${id}/unlock`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50 font-medium"
                  >
                    <Eye size={18} /> Request Contact Unlock
                  </button>

                  <button
                    onClick={() => setSaved(!saved)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium ${
                      saved ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart size={18} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
                  </button>
                </>
              )}

              <Link
                href={`/reports/new?type=listing&id=${listing.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 text-sm"
              >
                <Flag size={14} /> Report this listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-gray-900 text-sm">{value}</p>
    </div>
  )
}

function RuleItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-800 capitalize">{value}</span>
    </div>
  )
}
