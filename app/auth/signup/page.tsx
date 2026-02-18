'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Phone, Lock, User } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role')

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roles: {
      host: defaultRole === 'host',
      seeker: defaultRole === 'seeker',
    },
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email && !formData.phone) {
      toast('Please provide email or phone number', 'error')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match', 'error')
      return
    }

    if (!formData.roles.host && !formData.roles.seeker) {
      toast('Please select at least one role', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      toast('Account created successfully!', 'success')
      router.push('/auth/login?signup=success')
    } catch (error: any) {
      toast(error.message || 'Something went wrong', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dwella-blue/10 via-white to-dwella-purple/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-dwella-blue to-dwella-purple rounded-lg flex items-center justify-center">
              <Home className="text-white" size={28} />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-dwella-blue to-dwella-purple bg-clip-text text-transparent">
              dwella
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600 mt-2">Join thousands finding better housing</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    roles: { ...prev.roles, seeker: !prev.roles.seeker }
                  }))}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.roles.seeker
                      ? 'border-dwella-purple bg-dwella-purple/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={formData.roles.seeker ? 'text-dwella-purple' : 'text-gray-400'} />
                  <p className="font-medium mt-2">Find a Room</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    roles: { ...prev.roles, host: !prev.roles.host }
                  }))}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.roles.host
                      ? 'border-dwella-blue bg-dwella-blue/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Home className={formData.roles.host ? 'text-dwella-blue' : 'text-gray-400'} />
                  <p className="font-medium mt-2">List a Room</p>
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field pl-10"
                  placeholder="0801 234 5678"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Provide email OR phone number</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-dwella-purple font-medium hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
