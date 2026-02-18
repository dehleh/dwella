'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface VerificationRequest {
  id: string
  userId: string
  level: string
  status: string
  submittedAt: string
  user: {
    id: string
    email: string
    profile: { displayName: string; city: string | null } | null
  }
  artifacts: { id: string; artifactType: string; secureUri: string }[]
}

export default function AdminVerificationsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchVerifications()
  }, [session, page, statusFilter])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter })
      const res = await fetch(`/api/admin/verifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
        setTotalPages(data.pagination.pages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: noteInput[id] || '' }),
      })
      if (res.ok) {
        fetchVerifications()
        setExpandedId(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-500" />
          Verification Queue
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['PENDING', 'APPROVED', 'REJECTED', 'all'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusFilter === s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No verification requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{req.user.profile?.displayName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{req.user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {req.user.profile?.city || 'No city'} · Submitted {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Artifacts */}
              {req.artifacts.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {req.artifacts.map(art => (
                    <a
                      key={art.id}
                      href={art.secureUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {art.artifactType}
                    </a>
                  ))}
                </div>
              )}

              {/* Actions for pending */}
              {req.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t">
                  {expandedId === req.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={noteInput[req.id] || ''}
                        onChange={e => setNoteInput(prev => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Optional note (visible to user)..."
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(req.id, 'APPROVED')}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(req.id, 'REJECTED')}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Reject
                        </button>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpandedId(req.id)}
                      className="text-sm text-brand-600 font-medium hover:underline"
                    >
                      Review & Decide
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
