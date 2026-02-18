import { MapPin, Home as HomeIcon, Shield } from 'lucide-react'
import Image from 'next/image'

interface ListingCardProps {
  listing: {
    id: string
    neighborhood: string
    city: string
    priceMonthly: number
    roomType: string
    furnished: boolean
    utilitiesIncluded: boolean
    photos: any
    host?: {
      profile?: {
        displayName: string
        photos: any
      } | null
      verificationRequests?: Array<{
        level: string
        status: string
      }>
    }
  }
  matchScore?: number
  matchReasons?: string[]
  onClick?: () => void
}

export default function ListingCard({ listing, matchScore, matchReasons, onClick }: ListingCardProps) {
  const photos = Array.isArray(listing.photos) ? listing.photos : []
  const mainPhoto = photos[0] || '/placeholder-room.jpg'
  
  const isVerified = listing.host?.verificationRequests?.[0]?.status === 'APPROVED'
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {mainPhoto && (
          <Image
            src={mainPhoto}
            alt={`Room in ${listing.neighborhood}`}
            fill
            className="object-cover"
          />
        )}
        {matchScore && (
          <div className="absolute top-2 right-2 bg-brand-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {matchScore}% Match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
          <MapPin size={16} />
          <span>{listing.neighborhood}, {listing.city}</span>
        </div>

        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 mb-2">
          ₦{listing.priceMonthly.toLocaleString()}
          <span className="text-sm font-normal text-gray-600">/month</span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {listing.roomType.replace('_', ' ')}
          </span>
          {listing.furnished && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              Furnished
            </span>
          )}
          {listing.utilitiesIncluded && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              Utilities Included
            </span>
          )}
        </div>

        {/* Match Reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Why you match:</p>
            <ul className="space-y-1">
              {matchReasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Host Info */}
        {listing.host && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <HomeIcon size={16} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {listing.host.profile?.displayName || 'Host'}
              </p>
              {isVerified && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Shield size={12} />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
