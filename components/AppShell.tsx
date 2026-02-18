'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home, Search, MessageSquare, User, Settings, Shield,
  LogOut, Menu, X, Bell, PlusCircle, LayoutDashboard, Calendar, Eye
} from 'lucide-react'
import { useState } from 'react'

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roles = (session?.user as any)?.roles || {}
  const verificationStatus = (session?.user as any)?.verificationStatus
  const navItems = roles.host ? hostNav : seekerNav
  const isAdmin = roles.admin

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
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} className="text-gray-600" />
              </button>
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
