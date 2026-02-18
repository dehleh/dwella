'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Phone, Mail, User, CheckCircle, Clock, XCircle, ExternalLink, Loader2 } from 'lucide-react'

interface UnlockRequest {
  id: string
  listingId: string
  status: string
  unlockFee: number
  createdAt: string
  listing?: {
    neighborhood: string
    city: string
    priceMonthly: number
    roomType: string
  }
  host?: {
    profile?: { displayName: string }
  }
  contactInfo?: {
    email?: string
    phone?: string
    displayName?: string
  }
}

export default function UnlockPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestId = searchParams.get('request')
  const [unlockRequest, setUnlockRequest] = useState<UnlockRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')

  // Fetch existing unlock request or check if one exists
  useEffect(() => {
    if (!session) return
    const fetchData = async () => {
      try {
        // If we have a specific request ID (e.g. from payment callback)
        if (requestId) {
          const res = await fetch(`/api/unlock-requests/${requestId}`)
          if (res.ok) {
            const data = await res.json()
            setUnlockRequest(data.unlockRequest)
          }
        } else {
          // Check for existing request for this listing
          const res = await fetch(`/api/unlock-requests?listingId=${params.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.unlockRequests?.length > 0) {
              setUnlockRequest(data.unlockRequests[0])
              // Fetch full details
              const detailRes = await fetch(`/api/unlock-requests/${data.unlockRequests[0].id}`)
              if (detailRes.ok) {
                const detailData = await detailRes.json()
                setUnlockRequest(detailData.unlockRequest)
              }
            }
          }
        }
      } catch (err) {
        console.error('Fetch unlock data error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [session, params.id, requestId])

  const handleRequestUnlock = async () => {
    setRequesting(true)
    setError('')
    try {
      const res = await fetch('/api/unlock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: params.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send request')
        return
      }
      setUnlockRequest(data.unlockRequest)
    } catch (err) {
      setError('Network error')
    } finally {
      setRequesting(false)
    }
  }

  const handlePay = async () => {
    if (!unlockRequest) return
    setPaying(true)
    setError('')
    try {
      const res = await fetch(`/api/unlock-requests/${unlockRequest.id}/pay`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Payment failed')
        return
      }
      // Redirect to Paystack payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; description: string }> = {
    PENDING_HOST_APPROVAL: {
      icon: <Clock className="h-6 w-6" />,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      label: 'Waiting for Host',
      description: 'Your unlock request has been sent. The host needs to approve it before you can proceed with payment.',
    },
    APPROVED: {
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'Approved — Ready to Pay',
      description: 'The host has approved your request! Pay the unlock fee to reveal their contact details.',
    },
    DECLINED: {
      icon: <XCircle className="h-6 w-6" />,
      color: 'text-red-600 bg-red-50 border-red-200',
      label: 'Declined',
      description: 'The host has declined this unlock request. You can try messaging them to discuss further.',
    },
    PAYMENT_PENDING: {
      icon: <Clock className="h-6 w-6" />,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      label: 'Payment Processing',
      description: 'Your payment is being processed. This page will update once confirmed.',
    },
    PAID: {
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'Paid — Revealing Contact',
      description: 'Payment confirmed! Contact details are being revealed...',
    },
    CONTACT_REVEALED: {
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'Contact Unlocked!',
      description: 'You now have access to the host\'s contact details. Reach out to arrange next steps!',
    },
  }

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8">
      <button onClick={() => router.push(`/listings/${params.id}`)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back to listing
      </button>

      <div className="bg-white rounded-xl border shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-brand-500" />
            <h1 className="text-xl font-bold">Contact Unlock</h1>
          </div>
          <p className="text-sm text-gray-500">
            Unlock the host&apos;s contact details to arrange viewings and move-in directly.
          </p>
        </div>

        {/* No existing request — show CTA */}
        {!unlockRequest && (
          <div className="p-6 space-y-6">
            <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
              <h3 className="font-semibold text-brand-800 mb-2">How it works</h3>
              <ol className="text-sm text-brand-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span> You send an unlock request to the host
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span> The host approves (or declines) your request
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span> Once approved, you pay ₦2,000 unlock fee
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span> The host&apos;s phone number and email are revealed
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unlock fee</p>
                <p className="text-2xl font-bold">₦2,000</p>
              </div>
              <p className="text-xs text-gray-400 text-right max-w-[180px]">
                One-time fee per listing. Refundable if host doesn&apos;t respond within 72 hours.
              </p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

            <button
              onClick={handleRequestUnlock}
              disabled={requesting}
              className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {requesting ? 'Sending Request...' : 'Request Contact Unlock'}
            </button>
          </div>
        )}

        {/* Existing request — show status */}
        {unlockRequest && (
          <div className="p-6 space-y-6">
            {/* Status banner */}
            {statusConfig[unlockRequest.status] && (
              <div className={`rounded-lg p-4 border flex items-start gap-3 ${statusConfig[unlockRequest.status].color}`}>
                {statusConfig[unlockRequest.status].icon}
                <div>
                  <p className="font-semibold">{statusConfig[unlockRequest.status].label}</p>
                  <p className="text-sm mt-1 opacity-80">{statusConfig[unlockRequest.status].description}</p>
                </div>
              </div>
            )}

            {/* Pay button for approved requests */}
            {(unlockRequest.status === 'APPROVED') && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Amount to pay</p>
                    <p className="text-2xl font-bold">₦{unlockRequest.unlockFee.toLocaleString()}</p>
                  </div>
                  <img src="https://paystack.com/assets/img/logos/paystack.svg" alt="Paystack" className="h-6 opacity-60" />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {paying ? 'Redirecting to Paystack...' : 'Pay Now'}
                </button>
              </div>
            )}

            {/* Revealed contact details */}
            {unlockRequest.status === 'CONTACT_REVEALED' && unlockRequest.contactInfo && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200 space-y-4">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Host Contact Details
                </h3>

                {unlockRequest.contactInfo.displayName && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600">Name</p>
                      <p className="font-medium">{unlockRequest.contactInfo.displayName}</p>
                    </div>
                  </div>
                )}

                {unlockRequest.contactInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600">Phone</p>
                      <a href={`tel:${unlockRequest.contactInfo.phone}`} className="font-medium text-green-800 hover:underline">
                        {unlockRequest.contactInfo.phone}
                      </a>
                    </div>
                  </div>
                )}

                {unlockRequest.contactInfo.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600">Email</p>
                      <a href={`mailto:${unlockRequest.contactInfo.email}`} className="font-medium text-green-800 hover:underline">
                        {unlockRequest.contactInfo.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refresh hint for pending states */}
            {['PENDING_HOST_APPROVAL', 'PAYMENT_PENDING', 'PAID'].includes(unlockRequest.status) && (
              <p className="text-xs text-gray-400 text-center">
                This page refreshes automatically. You&apos;ll also receive a notification when there&apos;s an update.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
