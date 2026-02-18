'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AppShell } from '@/components/AppShell'
import { User, Camera, Shield, MapPin, Briefcase, Edit3, Save, CheckCircle, Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/utils'
import Link from 'next/link'

interface ProfileData {
  displayName: string
  bio: string
  occupation: string
  neighborhood: string
  city: string
  photos: string[]
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    occupation: '',
    neighborhood: '',
    city: '',
    photos: [],
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const user = session?.user as any
  const verificationStatus = user?.verificationStatus || 'NOT_STARTED'

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profiles/me')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (err) {
      console.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setEditing(false)
        setMessage('Profile updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const err = await res.json()
        setMessage(err.error || 'Failed to update profile')
      }
    } catch (err) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 text-sm font-medium"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium disabled:opacity-60"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Verification Badge */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          verificationStatus === 'APPROVED' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <Shield size={20} className={verificationStatus === 'APPROVED' ? 'text-green-600' : 'text-amber-600'} />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {verificationStatus === 'APPROVED' ? 'Identity Verified' : 'Not Yet Verified'}
            </p>
            <p className="text-sm text-gray-600">
              {verificationStatus === 'APPROVED'
                ? 'Your identity has been verified by Dwella.'
                : 'Complete verification to access all features.'}
            </p>
          </div>
          {verificationStatus !== 'APPROVED' && (
            <Link href="/verification" className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600">
              Verify
            </Link>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Photo Section */}
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center overflow-hidden">
              {profile.photos?.[0] ? (
                <img src={profile.photos[0]} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-brand-400" />
              )}
              {editing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const url = await uploadImage(file, 'profiles')
                        setProfile({ ...profile, photos: [url, ...profile.photos.slice(1)] })
                        setMessage('Photo uploaded!')
                        setTimeout(() => setMessage(''), 3000)
                      } catch (err: any) {
                        setMessage(err.message || 'Photo upload failed')
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              {editing ? (
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="text-xl font-bold text-gray-900 border-b-2 border-brand-300 focus:border-brand-500 outline-none"
                  placeholder="Display Name"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{profile.displayName || 'Set your name'}</h2>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                {verificationStatus === 'APPROVED' && <CheckCircle size={14} className="text-green-500" />}
                <span>{user?.email || user?.phone || ''}</span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-4">
            <ProfileField
              label="Bio"
              icon={<User size={16} className="text-gray-400" />}
              editing={editing}
              value={profile.bio}
              onChange={(v) => setProfile({ ...profile, bio: v })}
              placeholder="Tell others about yourself..."
              multiline
            />
            <ProfileField
              label="Occupation"
              icon={<Briefcase size={16} className="text-gray-400" />}
              editing={editing}
              value={profile.occupation}
              onChange={(v) => setProfile({ ...profile, occupation: v })}
              placeholder="What do you do?"
            />
            <div className="grid grid-cols-2 gap-4">
              <ProfileField
                label="City"
                icon={<MapPin size={16} className="text-gray-400" />}
                editing={editing}
                value={profile.city}
                onChange={(v) => setProfile({ ...profile, city: v })}
                placeholder="e.g. Lagos"
              />
              <ProfileField
                label="Neighborhood"
                icon={<MapPin size={16} className="text-gray-400" />}
                editing={editing}
                value={profile.neighborhood}
                onChange={(v) => setProfile({ ...profile, neighborhood: v })}
                placeholder="e.g. Lekki"
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/profile/preferences"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900 mb-1">Matching Preferences</h3>
            <p className="text-sm text-gray-500">Set your lifestyle and compatibility preferences</p>
          </Link>
          <Link
            href="/profile/settings"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900 mb-1">Account Settings</h3>
            <p className="text-sm text-gray-500">Change password, privacy settings, and more</p>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

function ProfileField({
  label, icon, editing, value, onChange, placeholder, multiline,
}: {
  label: string; icon: React.ReactNode; editing: boolean; value: string;
  onChange: (v: string) => void; placeholder: string; multiline?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
        {icon} {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={3}
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-gray-800 text-sm">{value || <span className="text-gray-400 italic">{placeholder}</span>}</p>
      )}
    </div>
  )
}
