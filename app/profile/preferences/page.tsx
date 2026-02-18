'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Sliders } from 'lucide-react'
import Link from 'next/link'

interface PreferencesData {
  hardConstraints: {
    budgetMin?: number
    budgetMax?: number
    neighborhoods?: string[]
    moveInFrom?: string
    moveInTo?: string
    minStay?: number
    roomType?: string[]
  }
  compatibility: {
    cleanliness?: number
    guestPolicy?: string
    quietHours?: string
    workSchedule?: string
    smoking?: string
    alcohol?: string
    cookingFrequency?: string
    pets?: string
  }
  dealbreakers?: string[]
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<PreferencesData>({
    hardConstraints: {},
    compatibility: {},
    dealbreakers: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/preferences/me')
      if (res.ok) {
        const data = await res.json()
        setPrefs(data)
      }
    } catch { /* empty */ } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/preferences/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (res.ok) {
        setMessage('Preferences saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to save')
      }
    } catch {
      setMessage('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updateHard = (key: string, value: any) =>
    setPrefs({ ...prefs, hardConstraints: { ...prefs.hardConstraints, [key]: value } })
  const updateCompat = (key: string, value: any) =>
    setPrefs({ ...prefs, compatibility: { ...prefs.compatibility, [key]: value } })

  if (loading) {
    return (
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
    )
  }

  return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Matching Preferences</h1>
              <p className="text-sm text-gray-600">Used to find your best room matches</p>
            </div>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>{message}</div>
        )}

        {/* Hard Constraints */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Must-Have Requirements</h2>
          </div>
          <p className="text-sm text-gray-500">Listings that don't meet these criteria won't show up in your results.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₦/month)</label>
              <input
                type="number"
                value={prefs.hardConstraints.budgetMin || ''}
                onChange={(e) => updateHard('budgetMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₦/month)</label>
              <input
                type="number"
                value={prefs.hardConstraints.budgetMax || ''}
                onChange={(e) => updateHard('budgetMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. 200000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Neighborhoods</label>
            <input
              type="text"
              value={(prefs.hardConstraints.neighborhoods || []).join(', ')}
              onChange={(e) => updateHard('neighborhoods', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="e.g. Lekki, Yaba, Surulere (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Move-in From</label>
              <input
                type="date"
                value={prefs.hardConstraints.moveInFrom || ''}
                onChange={(e) => updateHard('moveInFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stay (months)</label>
              <input
                type="number"
                value={prefs.hardConstraints.minStay || ''}
                onChange={(e) => updateHard('minStay', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. 6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
            <div className="flex gap-3 flex-wrap">
              {['ENSUITE', 'SHARED_BATH', 'STUDIO_ROOM', 'SHARED_APARTMENT', 'ONE_BEDROOM', 'TWO_BEDROOM'].map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(prefs.hardConstraints.roomType || []).includes(type)}
                    onChange={(e) => {
                      const current = prefs.hardConstraints.roomType || []
                      const next = e.target.checked ? [...current, type] : current.filter(t => t !== type)
                      updateHard('roomType', next)
                    }}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm">{{ ENSUITE: 'Ensuite', SHARED_BATH: 'Shared Bath', STUDIO_ROOM: 'Studio Room', SHARED_APARTMENT: 'Shared Apartment', ONE_BEDROOM: '1 Bedroom Flat', TWO_BEDROOM: '2 Bedroom Flat' }[type]}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Compatibility Preferences */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Compatibility Preferences</h2>
          <p className="text-sm text-gray-500">These are used to score compatibility and show you the best matches.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cleanliness Standard: <span className="text-brand-600 font-bold">{prefs.compatibility.cleanliness || 3}/5</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={prefs.compatibility.cleanliness || 3}
              onChange={(e) => updateCompat('cleanliness', parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Relaxed</span>
              <span>Very strict</span>
            </div>
          </div>

          <SelectField
            label="Guest Policy"
            value={prefs.compatibility.guestPolicy || ''}
            onChange={(v) => updateCompat('guestPolicy', v)}
            options={[
              { value: 'no_guests', label: 'No guests' },
              { value: 'occasional', label: 'Occasional' },
              { value: 'weekends', label: 'Weekends only' },
              { value: 'anytime', label: 'Anytime' },
            ]}
          />

          <SelectField
            label="Quiet Hours"
            value={prefs.compatibility.quietHours || ''}
            onChange={(v) => updateCompat('quietHours', v)}
            options={[
              { value: '21:00', label: 'By 9 PM' },
              { value: '22:00', label: 'By 10 PM' },
              { value: '23:00', label: 'By 11 PM' },
              { value: 'flexible', label: 'Flexible' },
            ]}
          />

          <SelectField
            label="Work Schedule"
            value={prefs.compatibility.workSchedule || ''}
            onChange={(v) => updateCompat('workSchedule', v)}
            options={[
              { value: 'day', label: 'Day (9-5)' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'night', label: 'Night shift' },
              { value: 'irregular', label: 'Irregular' },
            ]}
          />

          <SelectField
            label="Smoking"
            value={prefs.compatibility.smoking || ''}
            onChange={(v) => updateCompat('smoking', v)}
            options={[
              { value: 'no', label: 'No smoking' },
              { value: 'outside_only', label: 'Outside only' },
              { value: 'yes', label: 'OK with smoking' },
            ]}
          />

          <SelectField
            label="Alcohol"
            value={prefs.compatibility.alcohol || ''}
            onChange={(v) => updateCompat('alcohol', v)}
            options={[
              { value: 'no', label: 'No alcohol' },
              { value: 'occasionally', label: 'Occasionally' },
              { value: 'yes', label: 'Yes' },
            ]}
          />

          <SelectField
            label="Cooking Frequency"
            value={prefs.compatibility.cookingFrequency || ''}
            onChange={(v) => updateCompat('cookingFrequency', v)}
            options={[
              { value: 'rare', label: 'Rarely' },
              { value: 'few_times_weekly', label: 'A few times a week' },
              { value: 'daily', label: 'Daily' },
            ]}
          />

          <SelectField
            label="Pets Comfort"
            value={prefs.compatibility.pets || ''}
            onChange={(v) => updateCompat('pets', v)}
            options={[
              { value: 'no_pets', label: 'No pets' },
              { value: 'ok_cats', label: 'OK with cats' },
              { value: 'ok_dogs', label: 'OK with dogs' },
              { value: 'ok_all', label: 'OK with all pets' },
            ]}
          />
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-60"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
