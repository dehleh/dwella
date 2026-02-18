'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Search, Loader2, ChevronLeft, ChevronRight, Shield, Ban } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  phone: string | null
  roles: any
  status: string
  createdAt: string
  lastLoginAt: string | null
  profile: { displayName: string; city: string | null } | null
  verificationStatus: string
  _count: { listings: number; sentMessages: number; reportsReceived: number }
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [session, page, statusFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleUpdateUser = async (userId: string, update: { status?: string; roles?: any }) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
    BANNED: 'bg-red-100 text-red-800',
  }

  const verificationColors: Record<string, string> = {
    NOT_STARTED: 'text-gray-400',
    PENDING: 'text-yellow-600',
    APPROVED: 'text-green-600',
    REJECTED: 'text-red-600',
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-500" />
          User Management
        </h1>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.profile?.displayName || 'No name'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.status] || ''}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium flex items-center gap-1 ${verificationColors[u.verificationStatus] || ''}`}>
                        <Shield className="h-3 w-3" />
                        {u.verificationStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {Object.entries(u.roles || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u._count.listings}L · {u._count.sentMessages}M · {u._count.reportsReceived}R
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateUser(u.id, { status: 'SUSPENDED' })}
                            disabled={actionLoading === u.id}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Suspend"
                          >
                            {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                          </button>
                        )}
                        {u.status === 'SUSPENDED' && (
                          <>
                            <button
                              onClick={() => handleUpdateUser(u.id, { status: 'ACTIVE' })}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                            >
                              Reactivate
                            </button>
                            <button
                              onClick={() => handleUpdateUser(u.id, { status: 'BANNED' })}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {u.status === 'BANNED' && (
                          <button
                            onClick={() => handleUpdateUser(u.id, { status: 'ACTIVE' })}
                            disabled={actionLoading === u.id}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
    </div>
  )
}
