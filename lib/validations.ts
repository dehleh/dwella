// Validation schemas using Zod
import { z } from 'zod'

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8).max(100),
  role: z.enum(['host', 'seeker', 'both']),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
})

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
})

// Profile schemas
export const profileSchema = z.object({
  displayName: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  neighborhood: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
})

// Listing schemas
export const listingSchema = z.object({
  city: z.string().min(2),
  neighborhood: z.string().min(2),
  priceMonthly: z.number().min(1000).max(10000000),
  deposit: z.number().min(0).optional(),
  roomType: z.enum(['ENSUITE', 'SHARED_BATH', 'STUDIO_ROOM', 'SHARED_APARTMENT', 'ONE_BEDROOM', 'TWO_BEDROOM']),
  furnished: z.boolean(),
  utilitiesIncluded: z.boolean(),
  minStayMonths: z.number().min(1).max(24),
  availableFrom: z.string().or(z.date()),
  rules: z.object({
    guests: z.enum(['no_guests', 'occasional', 'weekends', 'anytime']).optional(),
    quietHours: z.string().optional(),
    smoking: z.enum(['no', 'outside_only', 'yes']).optional(),
    pets: z.enum(['no_pets', 'cats', 'dogs', 'all']).optional(),
  }),
})

// Preferences schemas
export const preferencesSchema = z.object({
  hardConstraints: z.object({
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    neighborhoods: z.array(z.string()).optional(),
    moveInFrom: z.string().optional(),
    moveInTo: z.string().optional(),
    minStay: z.number().optional(),
    roomType: z.array(z.string()).optional(),
  }),
  compatibility: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    guestPolicy: z.enum(['no_guests', 'occasional', 'weekends', 'anytime']).optional(),
    quietHours: z.string().optional(),
    workSchedule: z.enum(['day', 'hybrid', 'night', 'irregular']).optional(),
    smoking: z.enum(['no', 'outside_only', 'yes']).optional(),
    alcohol: z.enum(['no', 'occasionally', 'yes']).optional(),
    cookingFrequency: z.enum(['rare', 'few_times_weekly', 'daily']).optional(),
    pets: z.enum(['no_pets', 'ok_cats', 'ok_dogs', 'ok_all']).optional(),
  }),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ListingInput = z.infer<typeof listingSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
