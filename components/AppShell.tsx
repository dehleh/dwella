'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home, Search, MessageSquare, User, Settings, Shield,
  LogOut, Menu, X, Bell, PlusCircle, LayoutDashboard, Calendar, Eye,
  CheckCheck, MessageCircle, Key, ShieldCheck, CalendarCheck, AlertTriangle
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}

const seekerNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse Rooms', href: '/listings', icon: Search },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Viewings', href: '/viewings', icon: Calendar },
  { label: 'Profile', href: '/profile', icon: User },
]

const hostNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Listings', href: '/dashboard/listings', icon: Home },
  { label: 'Create Listing', href: '/listings/create', icon: PlusCircle },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Viewings', href: '/viewings', icon: Calendar },
  { label: 'Profile', href: '/profile', icon: User },
]

function getNotificationIcon(type: string) {
  switch (type) {
    case 'MESSAGE': return <MessageCircle size={16} className="text-blue-500" />
    case 'UNLOCK_REQUEST':
    case 'UNLOCK_APPROVED':
    case 'UNLOCK_DECLINED': return <Key size={16} className="text-purple-500" />
    case 'VERIFICATION_APPROVED': return <ShieldCheck size={16} className="text-green-500" />
    case 'VERIFICATION_REJECTED': return <AlertTriangle size={16} className="text-red-500" />
    case 'VIEWING_PROPOSED':
    case 'VIEWING_CONFIRMED':
    case 'VIEWING_CANCELLED': return <CalendarCheck size={16} className="text-teal-500" />
    case 'PAYMENT_RECEIVED': return <Key size={16} className="text-green-600" />
    default: return <Bell size={16} className="text-gray-500" />
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const roles = (session?.user as any)?.roles || {}
  const verificationStatus = (session?.user as any)?.verificationStatus
  const navItems = roles.host ? hostNav : seekerNav
  const isAdmin = roles.admin

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=15')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // silently fail
    }
  }, [])

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (!session) return
    fetchNotifications()
    pollRef.current = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(pollRef.current)
  }, [session, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notifOpen])

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silently fail
    }
  }

  async function handleNotificationClick(notif: Notification) {
    // Mark as read
    if (!notif.isRead) {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notif.id] }),
      }).catch(() => {})
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    // Navigate
    if (notif.linkUrl) {
      setNotifOpen(false)
      router.push(notif.linkUrl)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Home className="text-brand-500" size={24} />
                <span className="text-xl font-bold text-gray-900">Dwella</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {verificationStatus !== 'APPROVED' && (
                <Link
                  href="/verification"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100"
                >
                  <Shield size={14} />
                  Verify Account
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100"
                >
                  <Settings size={14} />
                  Admin
                </Link>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen)
                    if (!notifOpen) fetchNotifications()
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                              !notif.isRead ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notif.body}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white pt-20 pb-4 overflow-y-auto">
              <nav className="px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  )
                })}
                <hr className="my-3" />
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-6 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
