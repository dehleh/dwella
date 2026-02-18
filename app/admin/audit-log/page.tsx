'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Activity, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface LogEntry {
  id: string
  action: string
  targetType: string
  targetId: string
  metadata: any
  createdAt: string
  admin: { id: string; email: string; profile: { displayName: string } | null }
}

export default function AdminAuditLogPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [session, page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/audit-log?page=${page}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.pages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-brand-500" />
        Audit Log
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No admin actions logged yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.admin.profile?.displayName || log.admin.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.targetType} / {log.targetId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
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
      )}
    </div>
  )
}
