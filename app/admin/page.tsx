'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Shield, Home, MessageSquare, AlertTriangle, CreditCard,
  Eye, Activity, Loader2, TrendingUp
} from 'lucide-react'

interface Stats {
  users: { total: number; active: number; suspended: number; recentSignups: number }
  verification: { pending: number; approved: number }
  listings: { total: number; published: number }
  messaging: { conversations: number; messages: number }
  reports: { open: number }
  payments: { total: number; successful: number; revenue: number }
  viewings: { total: number }
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    const roles = (session.user as any)?.roles as any
    if (!roles?.admin) {
      router.push('/dashboard')
      return
    }
    fetchStats()
  }, [session])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Users',
      value: stats?.users.total || 0,
      sub: `${stats?.users.recentSignups || 0} this week`,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Pending Verifications',
      value: stats?.verification.pending || 0,
      sub: `${stats?.verification.approved || 0} approved`,
      icon: <Shield className="h-5 w-5" />,
      color: 'text-yellow-600 bg-yellow-50',
      urgent: (stats?.verification.pending || 0) > 0,
    },
    {
      label: 'Published Listings',
      value: stats?.listings.published || 0,
      sub: `${stats?.listings.total || 0} total`,
      icon: <Home className="h-5 w-5" />,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Messages',
      value: stats?.messaging.messages || 0,
      sub: `${stats?.messaging.conversations || 0} conversations`,
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Open Reports',
      value: stats?.reports.open || 0,
      sub: 'Needs review',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-600 bg-red-50',
      urgent: (stats?.reports.open || 0) > 0,
    },
    {
      label: 'Revenue',
      value: `₦${((stats?.payments.revenue || 0)).toLocaleString()}`,
      sub: `${stats?.payments.successful || 0} payments`,
      icon: <CreditCard className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Viewings',
      value: stats?.viewings.total || 0,
      sub: 'Total scheduled',
      icon: <Eye className="h-5 w-5" />,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Suspended Users',
      value: stats?.users.suspended || 0,
      sub: `${stats?.users.active || 0} active`,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-gray-600 bg-gray-50',
    },
  ]

  const quickActions = [
    { label: 'Review Verifications', href: '/admin/verifications', icon: <Shield className="h-4 w-4" />, count: stats?.verification.pending },
    { label: 'Review Reports', href: '/admin/reports', icon: <AlertTriangle className="h-4 w-4" />, count: stats?.reports.open },
    { label: 'Manage Users', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Audit Log', href: '/admin/audit-log', icon: <Activity className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-brand-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-sm text-gray-500">Platform overview and management</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white rounded-xl border p-4 ${card.urgent ? 'ring-2 ring-red-200' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.color}`}>{card.icon}</div>
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="flex items-center gap-3 bg-white rounded-xl border p-4 hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-brand-50">
              {action.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{action.label}</p>
            </div>
            {action.count != null && action.count > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {action.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
