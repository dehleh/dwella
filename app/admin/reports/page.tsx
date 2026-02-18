'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReportRow {
  id: string
  category: string
  description: string
  status: string
  priority: string
  createdAt: string
  reporter: { id: string; email: string; profile: { displayName: string } | null }
  reportedUser: { id: string; email: string; profile: { displayName: string } | null } | null
  reportedListing: { id: string; neighborhood: string; city: string } | null
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-gray-100 text-gray-500',
}

export default function AdminReportsPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [session])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (id: string, update: any) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (res.ok) fetchReports()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        Reports Queue
      </h1>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-xl border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[report.priority]}`}>
                      {report.priority}
                    </span>
                    <span className="text-sm font-medium">{report.category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[report.status]}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>

              {/* People involved */}
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Reporter: {report.reporter.profile?.displayName || report.reporter.email}</span>
                {report.reportedUser && (
                  <span>Reported: {report.reportedUser.profile?.displayName || report.reportedUser.email}</span>
                )}
                {report.reportedListing && (
                  <span>Listing: {report.reportedListing.neighborhood}, {report.reportedListing.city}</span>
                )}
                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              {(report.status === 'OPEN' || report.status === 'IN_REVIEW') && (
                <div className="flex gap-2 pt-2 border-t flex-wrap">
                  {report.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateReport(report.id, { status: 'IN_REVIEW' })}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100"
                    >
                      Start Review
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateReport(report.id, { status: 'RESOLVED' })}
                    disabled={actionLoading === report.id}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleUpdateReport(report.id, { status: 'DISMISSED' })}
                    disabled={actionLoading === report.id}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100"
                  >
                    Dismiss
                  </button>
                  {report.reportedUser && (
                    <>
                      <button
                        onClick={() => handleUpdateReport(report.id, { status: 'RESOLVED', action: 'suspend' })}
                        disabled={actionLoading === report.id}
                        className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={() => handleUpdateReport(report.id, { status: 'RESOLVED', action: 'ban' })}
                        disabled={actionLoading === report.id}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                      >
                        Ban User
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
