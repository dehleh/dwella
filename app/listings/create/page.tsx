'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Home, MapPin, DollarSign, Calendar, Upload, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { uploadImages } from '@/lib/utils'

interface ListingFormData {
  city: string
  neighborhood: string
  priceMonthly: string
  deposit: string
  roomType: string
  furnished: boolean
  utilitiesIncluded: boolean
  minStayMonths: string
  availableFrom: string
  rules: {
    guests: string
    quietHours: string
    smoking: string
    pets: string
  }
  photos: File[]
  description: string
}

type WizardStep = 'location' | 'details' | 'rules' | 'photos' | 'review'
const steps: WizardStep[] = ['location', 'details', 'rules', 'photos', 'review']

export default function CreateListingPage() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('location')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ListingFormData>({
    city: 'Lagos',
    neighborhood: '',
    priceMonthly: '',
    deposit: '',
    roomType: 'ENSUITE',
    furnished: false,
    utilitiesIncluded: false,
    minStayMonths: '6',
    availableFrom: '',
    rules: { guests: 'occasional', quietHours: '22:00', smoking: 'no', pets: 'no_pets' },
    photos: [],
    description: '',
  })

  const currentStepIndex = steps.indexOf(step)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoBack = currentStepIndex > 0

  function goNext() {
    if (canGoNext) setStep(steps[currentStepIndex + 1])
  }
  function goBack() {
    if (canGoBack) setStep(steps[currentStepIndex - 1])
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // Upload photos to Cloudinary first
      let photoUrls: string[] = []
      if (formData.photos.length > 0) {
        photoUrls = await uploadImages(formData.photos, 'listings')
      }

      const payload = {
        city: formData.city,
        neighborhood: formData.neighborhood,
        priceMonthly: parseInt(formData.priceMonthly),
        deposit: formData.deposit ? parseInt(formData.deposit) : undefined,
        roomType: formData.roomType,
        furnished: formData.furnished,
        utilitiesIncluded: formData.utilitiesIncluded,
        minStayMonths: parseInt(formData.minStayMonths),
        availableFrom: formData.availableFrom,
        rules: formData.rules,
        photos: photoUrls,
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create listing')
      }

      const data = await res.json()
      router.push(`/listings/${data.listing.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/listings" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Listing</h1>
        </div>
        <p className="text-gray-600 mb-8 ml-12">List your spare room in a few easy steps.</p>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                i <= currentStepIndex ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Location */}
          {step === 'location' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Kano">Kano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Lekki Phase 1, Yaba, Surulere"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About this room (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Describe the room, amenities, and what makes it great..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold text-gray-900">Room Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₦)</label>
                  <input
                    type="number"
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. 150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (₦)</label>
                  <input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ENSUITE">Ensuite (private bath)</option>
                  <option value="SHARED_BATH">Shared Bath</option>
                  <option value="STUDIO_ROOM">Studio Room</option>
                  <option value="SHARED_APARTMENT">Shared Apartment</option>
                  <option value="ONE_BEDROOM">1 Bedroom Flat</option>
                  <option value="TWO_BEDROOM">2 Bedroom Flat</option>
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.furnished}
                    onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm">Furnished</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.utilitiesIncluded}
                    onChange={(e) => setFormData({ ...formData, utilitiesIncluded: e.target.checked })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm">Utilities Included</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stay (months)</label>
                  <input
                    type="number"
                    value={formData.minStayMonths}
                    onChange={(e) => setFormData({ ...formData, minStayMonths: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    min={1}
                    max={24}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rules */}
          {step === 'rules' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Home className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold text-gray-900">House Rules</h2>
              </div>
              <p className="text-sm text-gray-500">Set clear expectations for your roommate.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Policy</label>
                <select
                  value={formData.rules.guests}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, guests: e.target.value } })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="no_guests">No guests allowed</option>
                  <option value="occasional">Occasional guests OK</option>
                  <option value="weekends">Weekends only</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours</label>
                <select
                  value={formData.rules.quietHours}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, quietHours: e.target.value } })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="21:00">From 9 PM</option>
                  <option value="22:00">From 10 PM</option>
                  <option value="23:00">From 11 PM</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                <select
                  value={formData.rules.smoking}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, smoking: e.target.value } })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="no">No smoking</option>
                  <option value="outside_only">Outside only</option>
                  <option value="yes">Allowed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pets</label>
                <select
                  value={formData.rules.pets}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, pets: e.target.value } })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="no_pets">No pets</option>
                  <option value="cats">Cats OK</option>
                  <option value="dogs">Dogs OK</option>
                  <option value="all">All pets OK</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 'photos' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
              </div>
              <p className="text-sm text-gray-500">Add at least 2 photos of the room. Good photos attract more seekers.</p>

              <div className="grid grid-cols-3 gap-3">
                {formData.photos.map((file, index) => (
                  <div key={index} className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Room photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        photos: formData.photos.filter((_, i) => i !== index),
                      })}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setFormData({ ...formData, photos: [...formData.photos, ...files] })
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 'review' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold text-gray-900">Review Your Listing</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <ReviewRow label="Location" value={`${formData.neighborhood}, ${formData.city}`} />
                <ReviewRow label="Monthly Rent" value={`₦${parseInt(formData.priceMonthly || '0').toLocaleString()}`} />
                {formData.deposit && <ReviewRow label="Deposit" value={`₦${parseInt(formData.deposit).toLocaleString()}`} />}
                <ReviewRow label="Room Type" value={
                  { ENSUITE: 'Ensuite', SHARED_BATH: 'Shared Bath', STUDIO_ROOM: 'Studio Room', SHARED_APARTMENT: 'Shared Apartment', ONE_BEDROOM: '1 Bedroom Flat', TWO_BEDROOM: '2 Bedroom Flat' }[formData.roomType] || formData.roomType
                } />
                <ReviewRow label="Furnished" value={formData.furnished ? 'Yes' : 'No'} />
                <ReviewRow label="Utilities" value={formData.utilitiesIncluded ? 'Included' : 'Not included'} />
                <ReviewRow label="Available From" value={formData.availableFrom} />
                <ReviewRow label="Min Stay" value={`${formData.minStayMonths} months`} />
                <ReviewRow label="Guest Policy" value={formData.rules.guests} />
                <ReviewRow label="Quiet Hours" value={formData.rules.quietHours === 'flexible' ? 'Flexible' : `From ${formData.rules.quietHours}`} />
                <ReviewRow label="Smoking" value={formData.rules.smoking} />
                <ReviewRow label="Pets" value={formData.rules.pets} />
                <ReviewRow label="Photos" value={`${formData.photos.length} uploaded`} />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                Your listing will be created as a <strong>Draft</strong>. You can publish it from your dashboard after review.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            {canGoBack && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                <ArrowLeft size={18} /> Back
              </button>
            )}
            <div className="flex-1" />
            {canGoNext ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
