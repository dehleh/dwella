'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'SCAM', label: 'Scam / Fraud', description: 'This person is trying to collect money outside Dwella' },
  { value: 'HARASSMENT', label: 'Harassment', description: 'Threatening, abusive, or unwanted contact' },
  { value: 'IMPERSONATION', label: 'Impersonation', description: 'Pretending to be someone they are not' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', description: 'Offensive photos, messages, or listing details' },
  { value: 'SAFETY_RISK', label: 'Safety Risk', description: 'Unsafe living conditions or personal safety concerns' },
  { value: 'OTHER', label: 'Other', description: 'Something else not covered above' },
]

function ReportContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const reportedUserId = searchParams.get('userId')
  const reportedListingId = searchParams.get('listingId')
  const reportedMessageId = searchParams.get('messageId')

  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || description.trim().length < 10) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: reportedUserId || undefined,
          reportedListingId: reportedListingId || undefined,
          reportedMessageId: reportedMessageId || undefined,
          category,
          description: description.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit report')
        return
      }
      setSubmitted(true)
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-6 mt-12">
        <div className="bg-white rounded-xl border p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Report Submitted</h2>
          <p className="text-gray-500">Our trust & safety team will review your report within 24 hours. We may reach out for additional information.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h1 className="text-xl font-bold">Submit a Report</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Your safety matters</p>
          <p>Reports are reviewed by our team within 24 hours. If you&apos;re in immediate danger, please contact the police.</p>
        </div>

        {/* Category selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">What are you reporting?</label>
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <label
                key={cat.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  category === cat.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tell us what happened <span className="text-gray-400">(min 10 characters)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the issue in detail. Include dates, times, screenshots links if possible..."
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <p className="text-xs text-gray-400">{description.length} characters</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !category || description.trim().length < 10}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportContent />
    </Suspense>
  )
}
