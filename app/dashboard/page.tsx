'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Home, Search, MessageSquare, Shield, Eye, Clock,
  CheckCircle, AlertTriangle, PlusCircle, TrendingUp, Users
} from 'lucide-react'

interface DashboardStats {
  listingsCount: number
  conversationsCount: number
  unlockRequestsCount: number
  viewingsCount: number
  matchesCount: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const user = session?.user as any
  const roles = user?.roles || {}
  const verificationStatus = user?.verificationStatus || 'NOT_STARTED'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-gray-600 mt-1">
            {roles.host ? 'Manage your listings and connect with seekers' : 'Find your perfect room match'}
          </p>
        </div>

        {/* Verification Banner */}
        {verificationStatus !== 'APPROVED' && (
          <div className={`rounded-xl p-4 flex items-center justify-between ${
            verificationStatus === 'PENDING' 
              ? 'bg-amber-50 border border-amber-200' 
              : verificationStatus === 'REJECTED'
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {verificationStatus === 'PENDING' ? (
                <Clock className="text-amber-600" size={24} />
              ) : verificationStatus === 'REJECTED' ? (
                <AlertTriangle className="text-red-600" size={24} />
              ) : (
                <Shield className="text-blue-600" size={24} />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {verificationStatus === 'PENDING'
                    ? 'Verification in progress'
                    : verificationStatus === 'REJECTED'
                    ? 'Verification needs attention'
                    : 'Complete your verification'}
                </p>
                <p className="text-sm text-gray-600">
                  {verificationStatus === 'PENDING'
                    ? 'We are reviewing your documents. This usually takes less than 24 hours.'
                    : verificationStatus === 'REJECTED'
                    ? 'Your verification was not successful. Please resubmit.'
                    : 'Verify your identity to unlock all features — messaging, contact unlock, and more.'}
                </p>
              </div>
            </div>
            {verificationStatus !== 'PENDING' && (
              <Link
                href="/verification"
                className="flex-shrink-0 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium"
              >
                {verificationStatus === 'REJECTED' ? 'Resubmit' : 'Start Verification'}
              </Link>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roles.host && (
            <Link
              href="/listings/create"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <PlusCircle className="text-brand-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">New Listing</span>
            </Link>
          )}
          {roles.seeker && (
            <Link
              href="/listings"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <Search className="text-brand-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">Browse Rooms</span>
            </Link>
          )}
          <Link
            href="/messages"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-brand-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Messages</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <Users className="text-brand-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Profile</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roles.host && (
            <StatCard
              label="Active Listings"
              value={stats?.listingsCount ?? '—'}
              icon={<Home size={20} className="text-brand-600" />}
            />
          )}
          {roles.seeker && (
            <StatCard
              label="Matches Found"
              value={stats?.matchesCount ?? '—'}
              icon={<TrendingUp size={20} className="text-green-600" />}
            />
          )}
          <StatCard
            label="Conversations"
            value={stats?.conversationsCount ?? '—'}
            icon={<MessageSquare size={20} className="text-blue-600" />}
          />
          <StatCard
            label="Unlock Requests"
            value={stats?.unlockRequestsCount ?? '—'}
            icon={<Eye size={20} className="text-purple-600" />}
          />
          <StatCard
            label="Viewings"
            value={stats?.viewingsCount ?? '—'}
            icon={<CheckCircle size={20} className="text-teal-600" />}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-medium">
                    {activity.type?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity. Start by browsing listings or completing your profile!</p>
          )}
        </div>
      </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
