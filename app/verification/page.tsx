'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Upload, Camera, CheckCircle, Clock, AlertTriangle, ArrowRight, ArrowLeft, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { uploadImage } from '@/lib/utils'

type VerificationStep = 'info' | 'id-upload' | 'selfie' | 'review' | 'status'

interface VerificationData {
  legalName: string
  dateOfBirth: string
  idType: string
  idNumber: string
  idFrontFile: File | null
  idBackFile: File | null
  selfieFile: File | null
}

export default function VerificationPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<VerificationStep>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStatus, setCurrentStatus] = useState<string>('NOT_STARTED')
  const [rejectionReason, setRejectionReason] = useState('')
  const [formData, setFormData] = useState<VerificationData>({
    legalName: '',
    dateOfBirth: '',
    idType: 'NIN',
    idNumber: '',
    idFrontFile: null,
    idBackFile: null,
    selfieFile: null,
  })

  useEffect(() => {
    fetchVerificationStatus()
  }, [])

  async function fetchVerificationStatus() {
    try {
      const res = await fetch('/api/verification/status')
      if (res.ok) {
        const data = await res.json()
        setCurrentStatus(data.status)
        if (data.status === 'PENDING' || data.status === 'APPROVED') {
          setStep('status')
        } else if (data.status === 'REJECTED') {
          setRejectionReason(data.decisionNote || 'Please resubmit with clearer documents.')
          setStep('status')
        }
      }
    } catch (err) {
      console.error('Failed to fetch verification status')
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // Upload KYC documents to Cloudinary
      const artifacts: { type: string; uri: string }[] = []

      if (formData.idFrontFile) {
        const url = await uploadImage(formData.idFrontFile, 'kyc')
        artifacts.push({ type: 'ID_FRONT', uri: url })
      }
      if (formData.idBackFile) {
        const url = await uploadImage(formData.idBackFile, 'kyc')
        artifacts.push({ type: 'ID_BACK', uri: url })
      }
      if (formData.selfieFile) {
        const url = await uploadImage(formData.selfieFile, 'kyc')
        artifacts.push({ type: 'SELFIE', uri: url })
      }

      const payload = {
        legalName: formData.legalName,
        dateOfBirth: formData.dateOfBirth,
        idType: formData.idType,
        idNumber: formData.idNumber,
        artifacts,
      }

      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Submission failed')
      }

      setCurrentStatus('PENDING')
      setStep('status')
      await updateSession()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleResubmit() {
    setCurrentStatus('NOT_STARTED')
    setStep('info')
    setError('')
  }

  // Status view
  if (step === 'status') {
    return (
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            {currentStatus === 'APPROVED' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verified</h2>
                <p className="text-gray-600 mb-6">
                  Your identity has been verified. You now have full access to Dwella features.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
                >
                  Go to Dashboard
                </button>
              </>
            )}
            {currentStatus === 'PENDING' && (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-amber-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verification In Progress</h2>
                <p className="text-gray-600 mb-6">
                  We're reviewing your documents. This typically takes less than 24 hours.
                  We'll notify you once the review is complete.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Back to Dashboard
                </button>
              </>
            )}
            {currentStatus === 'REJECTED' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Unsuccessful</h2>
                <p className="text-gray-600 mb-2">
                  Unfortunately, we couldn't verify your identity.
                </p>
                {rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-sm text-red-700">
                    <strong>Reason:</strong> {rejectionReason}
                  </div>
                )}
                <button
                  onClick={handleResubmit}
                  className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
                >
                  Resubmit Verification
                </button>
              </>
            )}
          </div>
        </div>
    )
  }

  return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Complete verification to access all Dwella features. Your data is encrypted and secure.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(['info', 'id-upload', 'selfie', 'review'] as VerificationStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-brand-500 text-white' :
                (['info', 'id-upload', 'selfie', 'review'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {(['info', 'id-upload', 'selfie', 'review'].indexOf(step) > i) ? '✓' : i + 1}
              </div>
              {i < 3 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Personal Info */}
          {step === 'info' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-brand-500" size={24} />
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Full Name</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="As it appears on your ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="NIN">National Identification Number (NIN)</option>
                  <option value="VOTERS_CARD">Voter's Card</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="PASSPORT">International Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter your ID number"
                />
              </div>

              <button
                onClick={() => {
                  if (!formData.legalName || !formData.dateOfBirth || !formData.idNumber) {
                    setError('Please fill in all required fields')
                    return
                  }
                  setError('')
                  setStep('id-upload')
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: ID Upload */}
          {step === 'id-upload' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="text-brand-500" size={24} />
                <h2 className="text-lg font-semibold text-gray-900">Upload ID Document</h2>
              </div>
              <p className="text-sm text-gray-600">
                Please upload clear, well-lit photos of the front and back of your ID.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FileUploadBox
                  label="ID Front"
                  file={formData.idFrontFile}
                  onFileChange={(f) => setFormData({ ...formData, idFrontFile: f })}
                />
                <FileUploadBox
                  label="ID Back"
                  file={formData.idBackFile}
                  onFileChange={(f) => setFormData({ ...formData, idBackFile: f })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('selfie')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Selfie */}
          {step === 'selfie' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="text-brand-500" size={24} />
                <h2 className="text-lg font-semibold text-gray-900">Selfie Verification</h2>
              </div>
              <p className="text-sm text-gray-600">
                Take a clear selfie. Make sure your face is well-lit and matches your ID photo.
              </p>

              <FileUploadBox
                label="Your Selfie"
                file={formData.selfieFile}
                onFileChange={(f) => setFormData({ ...formData, selfieFile: f })}
                large
                capture="user"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('id-upload')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
                >
                  Review <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-brand-500" size={24} />
                <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-medium">{formData.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date of Birth</span>
                  <span className="text-sm font-medium">{formData.dateOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID Type</span>
                  <span className="text-sm font-medium">{formData.idType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID Number</span>
                  <span className="text-sm font-medium">{formData.idNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Documents</span>
                  <span className="text-sm font-medium text-green-600">3 files uploaded</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Privacy notice:</strong> Your documents are encrypted and stored securely. 
                Only authorized Dwella team members can review them during verification.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('selfie')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}

function FileUploadBox({
  label,
  file,
  onFileChange,
  large,
  capture,
}: {
  label: string
  file: File | null
  onFileChange: (f: File) => void
  large?: boolean
  capture?: 'user' | 'environment'
}) {
  return (
    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-brand-400 hover:bg-brand-50/50 ${
      file ? 'border-green-400 bg-green-50/50' : 'border-gray-300'
    } ${large ? 'h-48' : 'h-36'}`}>
      {file ? (
        <div className="text-center">
          <CheckCircle className="text-green-500 mx-auto mb-1" size={24} />
          <p className="text-sm font-medium text-green-700">{file.name}</p>
          <p className="text-xs text-gray-500">Click to replace</p>
        </div>
      ) : (
        <div className="text-center">
          {capture ? (
            <Camera className="text-gray-400 mx-auto mb-1" size={24} />
          ) : (
            <Upload className="text-gray-400 mx-auto mb-1" size={24} />
          )}
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xs text-gray-400">{capture ? 'Click to take photo' : 'Click to upload'}</p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
        }}
      />
    </label>
  )
}
