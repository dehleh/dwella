'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import ListingCard from '@/components/ListingCard'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react'

interface ListingResult {
  id: string
  city: string
  neighborhood: string
  priceMonthly: number
  roomType: string
  furnished: boolean
  utilitiesIncluded: boolean
  minStayMonths: number
  availableFrom: string
  rules: any
  photos: string[]
  status: string
  host: {
    id: string
    profile: { displayName: string; photos: any[] } | null
    verified: boolean
  }
  matchScore?: number
  matchReasons?: string[]
}

function ListingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<ListingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  // Filter state
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || 'Lagos',
    neighborhood: searchParams.get('neighborhood') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    roomType: searchParams.get('roomType') || '',
    page: parseInt(searchParams.get('page') || '1'),
  })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.city) params.set('city', filters.city)
      if (filters.neighborhood) params.set('neighborhood', filters.neighborhood)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.roomType) params.set('roomType', filters.roomType)
      params.set('page', filters.page.toString())

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Also try to get recommended matches
  const [recommended, setRecommended] = useState<ListingResult[]>([])
  useEffect(() => {
    async function fetchRecommended() {
      try {
        const res = await fetch('/api/matches/recommended?city=' + filters.city)
        if (res.ok) {
          const data = await res.json()
          setRecommended(data.matches || [])
        }
      } catch { /* ignore */ }
    }
    fetchRecommended()
  }, [filters.city])

  function applyFilters() {
    setFilters({ ...filters, page: 1 })
    setShowFilters(false)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header + Search */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Rooms</h1>
            <p className="text-gray-600">Find verified spare rooms in your area</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Neighborhood</label>
                <input
                  type="text"
                  value={filters.neighborhood}
                  onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Any neighborhood"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Price (₦)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Price (₦)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Room Type</label>
                <select
                  value={filters.roomType}
                  onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Any</option>
                  <option value="ENSUITE">Ensuite</option>
                  <option value="SHARED_BATH">Shared Bath</option>
                  <option value="STUDIO_ROOM">Studio Room</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setFilters({ city: 'Lagos', neighborhood: '', minPrice: '', maxPrice: '', roomType: '', page: 1 })
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Recommended Section */}
        {recommended.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">🎯 Recommended for You</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.slice(0, 3).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* All Listings */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {filters.neighborhood ? `Rooms in ${filters.neighborhood}` : `All Rooms in ${filters.city}`}
          </h2>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        filters.page === page ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No listings found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  )
}
