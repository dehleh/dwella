// Matching algorithm - compatibility scoring
import { Listing, Preferences } from '@prisma/client'

interface MatchScore {
  listingId: string
  score: number
  reasons: string[]
}

interface CompatibilityData {
  cleanliness?: number // 1-5
  guestPolicy?: 'no_guests' | 'occasional' | 'weekends' | 'anytime'
  quietHours?: string
  workSchedule?: 'day' | 'hybrid' | 'night' | 'irregular'
  smoking?: 'no' | 'outside_only' | 'yes'
  alcohol?: 'no' | 'occasionally' | 'yes'
  cookingFrequency?: 'rare' | 'few_times_weekly' | 'daily'
  pets?: 'no_pets' | 'ok_cats' | 'ok_dogs' | 'ok_all'
}

interface ListingRules {
  guests?: 'no_guests' | 'occasional' | 'weekends' | 'anytime'
  quietHours?: string
  smoking?: 'no' | 'outside_only' | 'yes'
  pets?: 'no_pets' | 'cats' | 'dogs' | 'all'
}

// Compatibility dimension weights (total = 100)
const WEIGHTS = {
  cleanliness: 20,
  guestPolicy: 15,
  quietHours: 15,
  workSchedule: 15,
  smoking: 10,
  alcohol: 10,
  cooking: 10,
  pets: 10,
}

export function calculateMatchScore(
  seekerPreferences: Preferences,
  listing: Listing & { rules: any }
): MatchScore {
  const seekerCompat = seekerPreferences.compatibility as CompatibilityData
  const listingRules = listing.rules as ListingRules
  
  let totalScore = 0
  const reasons: string[] = []
  
  // 1. Cleanliness alignment (20 points)
  if (seekerCompat.cleanliness) {
    // For MVP, assume host also has a cleanliness preference (can extend schema later)
    // For now, award full points if seeker has preference
    totalScore += WEIGHTS.cleanliness
    reasons.push('Cleanliness preference noted')
  }
  
  // 2. Guest policy alignment (15 points)
  if (seekerCompat.guestPolicy && listingRules.guests) {
    const score = calculateGuestPolicyScore(seekerCompat.guestPolicy, listingRules.guests)
    totalScore += score
    if (score >= WEIGHTS.guestPolicy * 0.7) {
      reasons.push('Aligned guest policy')
    }
  }
  
  // 3. Quiet hours alignment (15 points)
  if (seekerCompat.quietHours && listingRules.quietHours) {
    const score = calculateQuietHoursScore(seekerCompat.quietHours, listingRules.quietHours)
    totalScore += score
    if (score >= WEIGHTS.quietHours * 0.7) {
      reasons.push('Similar quiet hours preference')
    }
  }
  
  // 4. Work schedule (15 points)
  if (seekerCompat.workSchedule) {
    // Award points for having a schedule (compatibility determined during chat)
    totalScore += WEIGHTS.workSchedule * 0.8
  }
  
  // 5. Smoking alignment (10 points)
  if (seekerCompat.smoking && listingRules.smoking) {
    const score = calculateSmokingScore(seekerCompat.smoking, listingRules.smoking)
    totalScore += score
    if (score >= WEIGHTS.smoking * 0.7) {
      reasons.push('Compatible smoking policy')
    }
  }
  
  // 6. Alcohol (10 points)
  if (seekerCompat.alcohol) {
    totalScore += WEIGHTS.alcohol * 0.8
  }
  
  // 7. Cooking frequency (10 points)
  if (seekerCompat.cookingFrequency) {
    totalScore += WEIGHTS.cooking * 0.8
  }
  
  // 8. Pets alignment (10 points)
  if (seekerCompat.pets && listingRules.pets) {
    const score = calculatePetsScore(seekerCompat.pets, listingRules.pets)
    totalScore += score
    if (score >= WEIGHTS.pets * 0.7) {
      reasons.push('Pet preferences aligned')
    }
  }
  
  // Normalize to 0-100 scale
  const finalScore = Math.min(100, Math.max(0, totalScore))
  
  return {
    listingId: listing.id,
    score: Math.round(finalScore),
    reasons: reasons.slice(0, 3), // Top 3 reasons
  }
}

function calculateGuestPolicyScore(
  seekerPolicy: string,
  hostPolicy: string
): number {
  const policyScores: Record<string, Record<string, number>> = {
    no_guests: { no_guests: 1.0, occasional: 0.3, weekends: 0.2, anytime: 0.0 },
    occasional: { no_guests: 0.3, occasional: 1.0, weekends: 0.8, anytime: 0.6 },
    weekends: { no_guests: 0.2, occasional: 0.8, weekends: 1.0, anytime: 0.8 },
    anytime: { no_guests: 0.0, occasional: 0.6, weekends: 0.8, anytime: 1.0 },
  }
  
  const score = policyScores[seekerPolicy]?.[hostPolicy] ?? 0.5
  return score * WEIGHTS.guestPolicy
}

function calculateQuietHoursScore(
  seekerHours: string,
  hostHours: string
): number {
  // Simple string comparison for MVP
  // In production, parse time ranges properly
  if (seekerHours === hostHours) {
    return WEIGHTS.quietHours
  }
  
  // Partial match logic
  const seekerTime = parseInt(seekerHours.split(':')[0] || '22')
  const hostTime = parseInt(hostHours.split(':')[0] || '22')
  const diff = Math.abs(seekerTime - hostTime)
  
  if (diff <= 1) return WEIGHTS.quietHours * 0.8
  if (diff <= 2) return WEIGHTS.quietHours * 0.5
  return WEIGHTS.quietHours * 0.2
}

function calculateSmokingScore(
  seekerPref: string,
  hostRule: string
): number {
  const smokingScores: Record<string, Record<string, number>> = {
    no: { no: 1.0, outside_only: 0.6, yes: 0.0 },
    outside_only: { no: 0.6, outside_only: 1.0, yes: 0.5 },
    yes: { no: 0.0, outside_only: 0.5, yes: 1.0 },
  }
  
  const score = smokingScores[seekerPref]?.[hostRule] ?? 0.5
  return score * WEIGHTS.smoking
}

function calculatePetsScore(
  seekerPref: string,
  hostRule: string
): number {
  const petsScores: Record<string, Record<string, number>> = {
    no_pets: { no_pets: 1.0, cats: 0.3, dogs: 0.3, all: 0.0 },
    ok_cats: { no_pets: 0.3, cats: 1.0, dogs: 0.5, all: 1.0 },
    ok_dogs: { no_pets: 0.3, cats: 0.5, dogs: 1.0, all: 1.0 },
    ok_all: { no_pets: 0.0, cats: 1.0, dogs: 1.0, all: 1.0 },
  }
  
  const score = petsScores[seekerPref]?.[hostRule] ?? 0.5
  return score * WEIGHTS.pets
}

// Hard constraints filter
export function applyHardConstraints(
  listings: Listing[],
  preferences: Preferences
): Listing[] {
  const constraints = preferences.hardConstraints as any
  
  return listings.filter(listing => {
    // Budget constraint
    if (constraints.budgetMin && listing.priceMonthly < constraints.budgetMin) {
      return false
    }
    if (constraints.budgetMax && listing.priceMonthly > constraints.budgetMax) {
      return false
    }
    
    // Neighborhood constraint
    if (constraints.neighborhoods?.length > 0) {
      if (!constraints.neighborhoods.includes(listing.neighborhood)) {
        return false
      }
    }
    
    // Move-in date constraint
    if (constraints.moveInFrom) {
      const moveInFrom = new Date(constraints.moveInFrom)
      if (listing.availableFrom > moveInFrom) {
        return false
      }
    }
    
    // Room type constraint
    if (constraints.roomType?.length > 0) {
      if (!constraints.roomType.includes(listing.roomType)) {
        return false
      }
    }
    
    // Minimum stay constraint
    if (constraints.minStay) {
      if (listing.minStayMonths < constraints.minStay) {
        return false
      }
    }
    
    return true
  })
}
