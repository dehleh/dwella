# Dwella MVP - Implementation Guide

This guide provides step-by-step instructions for completing the remaining features of the Dwella MVP.

## Quick Start Development Order

### Phase 1: Foundation (Already Done ✅)
1. ✅ Project setup with Next.js 14, TypeScript, Tailwind
2. ✅ Database schema (Prisma)
3. ✅ Authentication (NextAuth + signup/login pages)
4. ✅ Landing page
5. ✅ Matching algorithm
6. ✅ Validation schemas

### Phase 2: Core User Flows (Build Next)

#### 2.1 Profile Setup (Priority 1)

Create `app/profile/setup/page.tsx`:
```tsx
'use client'
// Multi-step form: Basic Info → Neighborhood → Photos
// Use profileSchema from lib/validations.ts
// POST to /api/profile on completion
```

Create `app/api/profile/route.ts`:
```ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const data = await req.json()
  
  // Validate with profileSchema
  // Update UserProfile in database
  // Return success
}
```

#### 2.2 KYC Verification (Priority 1)

Create `app/profile/verification/page.tsx`:
```tsx
'use client'
// Upload form for:
// - ID front image
// - ID back image  
// - Selfie (use HTML5 camera or file upload)
// POST to /api/kyc/submit
```

Create `app/api/kyc/submit/route.ts`:
```ts
import axios from 'axios'

export async function POST(req: Request) {
  const { userId, idType, idNumber, images } = await req.json()
  
  // Call Smile ID API (see README for example)
  // Create VerificationRequest with status PENDING
  // Save providerRef for tracking
  // Return job_id
}
```

Create `app/api/kyc/callback/route.ts`:
```ts
export async function POST(req: Request) {
  const webhookData = await req.json()
  
  // Verify webhook signature
  // Find VerificationRequest by providerRef
  // Update status to APPROVED or REJECTED
  // Send email/notification to user
}
```

#### 2.3 Listing Creation (Priority 1)

Create `app/listings/create/page.tsx`:
```tsx
'use client'
// Wizard: Basic → Photos → Rules → Review
// Use listingSchema from lib/validations.ts
// POST to /api/listings
// Redirect to listing detail on success
```

Create `app/api/listings/route.ts`:
```ts
// GET: Browse listings with filters
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  
  // Parse filters: city, neighborhood, minPrice, maxPrice, roomType
  // Query Listing model with filters
  // Include host profile (redacted)
  // Return paginated results
}

// POST: Create new listing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  // Check user is verified
  // Validate with listingSchema
  // Create Listing
  // Return listing ID
}
```

Create `app/listings/[id]/page.tsx`:
```tsx
// Server component
// Fetch listing by ID
// Show photos, details, rules, match reasons
// "Message Host" button → creates Conversation
// "Request Contact" button → creates UnlockRequest
```

#### 2.4 Browse & Search (Priority 1)

Create `app/listings/page.tsx`:
```tsx
'use client'
// Filter sidebar: budget, neighborhoods, roomType
// Listing cards grid
// Match score badge for verified seekers
// Click → navigate to /listings/[id]
```

Create `app/api/listings/recommended/route.ts`:
```ts
import { rankListings, calculateMatch } from '@/lib/matching'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  // Get user preferences
  // Get all PUBLISHED listings
  // Run matching algorithm
  // Return top 20 matches with scores and reasons
}
```

#### 2.5 Messaging System (Priority 1)

Create `app/messages/page.tsx`:
```tsx
'use client'
// List of conversations
// Show last message, unread count
// Click → navigate to /messages/[conversationId]
```

Create `app/messages/[id]/page.tsx`:
```tsx
'use client'
import { ChatBox } from '@/components/messages/ChatBox'

// Fetch conversation and messages
// Render ChatBox component
// Show listing context at top
```

Create `components/messages/ChatBox.tsx`:
```tsx
'use client'
import Pusher from 'pusher-js'

// Real-time message list
// Message input
// Subscribe to Pusher channel
// POST to /api/messages to send
// Update UI on new-message event
```

Create `lib/pusher.ts` (server):
```ts
import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
})
```

Create `app/api/messages/route.ts`:
```ts
import { pusher } from '@/lib/pusher'

export async function POST(req: Request) {
  const { conversationId, body } = await req.json()
  
  // Validate message with messageSchema
  // Create Message in database
  // Trigger Pusher event
  await pusher.trigger(
    `conversation-${conversationId}`,
    'new-message',
    message
  )
  
  return Response.json(message)
}
```

#### 2.6 Contact Unlock & Payments (Priority 1)

Create `components/listings/UnlockButton.tsx`:
```tsx
'use client'
// Button states: Request → Pending → Pay → Revealed
// POST to /api/unlock/request
// If auto-approved, show payment modal
// On payment success, reveal contact
```

Create `app/api/unlock/request/route.ts`:
```ts
export async function POST(req: Request) {
  const { listingId, hostUserId } = await req.json()
  
  // Check both users verified
  // Create UnlockRequest
  // If host has auto-approve, set status to APPROVED
  // Return unlock request
}
```

Create `app/api/unlock/pay/route.ts`:
```ts
import axios from 'axios'

export async function POST(req: Request) {
  const { unlockRequestId } = await req.json()
  
  // Initialize Paystack transaction (see README)
  // Update UnlockRequest status to PAYMENT_PENDING
  // Return authorization URL
}
```

Create `app/unlock/callback/page.tsx`:
```tsx
'use client'
// Handle Paystack redirect
// Verify transaction via API
// Show success/failure message
```

Create `app/api/unlock/verify/route.ts`:
```ts
import axios from 'axios'

export async function POST(req: Request) {
  const { reference } = await req.json()
  
  // Verify payment with Paystack
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  
  // Update PaymentTransaction
  // Update UnlockRequest to CONTACT_REVEALED
  // Create ContactReveal record
  // Return contact details
}
```

#### 2.7 Dashboard (Priority 1)

Create `app/dashboard/page.tsx`:
```tsx
'use client'
// If host: show listings, inbox, unlock requests
// If seeker: show saved listings, messages, viewings
// Stats: views, messages, matches
```

### Phase 3: V1 Features (After MVP Works)

#### 3.1 Viewing Scheduling
- `app/api/viewings/route.ts`
- `components/listings/ViewingScheduler.tsx`

#### 3.2 Preferences Management
- `app/profile/preferences/page.tsx`
- `app/api/preferences/route.ts`

#### 3.3 Admin Console
- `app/admin/layout.tsx` (protected route)
- `app/admin/verifications/page.tsx`
- `app/admin/reports/page.tsx`
- Multiple admin API routes

#### 3.4 Reports & Safety
- `components/ui/ReportModal.tsx`
- `app/api/reports/route.ts`
- `app/api/block/route.ts`

## API Route Template

Every API route should follow this pattern:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { someSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse & validate input
    const body = await req.json()
    const validation = someSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // 3. Authorization check (if needed)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (user?.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }

    // 4. Business logic
    const result = await prisma.someModel.create({
      data: validation.data,
    })

    // 5. Return success
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Database Queries Reference

### Common Patterns

```ts
// Get user with verification status
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    profile: true,
    verificationRequests: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  },
})

// Get listings with host info (redacted)
const listings = await prisma.listing.findMany({
  where: {
    status: 'PUBLISHED',
    city: filters.city,
    priceMonthly: { gte: filters.minPrice, lte: filters.maxPrice },
  },
  include: {
    host: {
      include: {
        profile: {
          select: {
            displayName: true,
            photos: true,
            // DO NOT include phone, email
          },
        },
        verificationRequests: {
          select: { status: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
})

// Get conversations with last message
const conversations = await prisma.conversation.findMany({
  where: {
    OR: [
      { hostUserId: userId },
      { seekerUserId: userId },
    ],
  },
  include: {
    listing: true,
    host: { include: { profile: true } },
    seeker: { include: { profile: true } },
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  },
})
```

## Testing as You Build

### Manual Testing Workflow

1. **Sign up** → Create account
2. **Verify KYC** → Upload test documents
3. **As Host**: Create listing
4. **As Seeker**: Browse listings, set preferences
5. **Chat**: Send messages between host and seeker
6. **Unlock**: Request contact, pay, verify reveal
7. **Admin**: Review KYC, handle reports

### Test Data Script

Create `scripts/seed.ts`:
```ts
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function seed() {
  // Create test host
  const host = await prisma.user.create({
    data: {
      email: 'host@test.com',
      passwordHash: await bcrypt.hash('password123', 12),
      roles: { host: true },
      profile: {
        create: {
          displayName: 'John Host',
          city: 'Lagos',
          neighborhood: 'Lekki',
        },
      },
      verificationRequests: {
        create: {
          status: 'APPROVED',
          level: 'STANDARD',
        },
      },
    },
  })

  // Create test listing
  await prisma.listing.create({
    data: {
      hostUserId: host.id,
      status: 'PUBLISHED',
      city: 'Lagos',
      neighborhood: 'Lekki',
      priceMonthly: 150000,
      roomType: 'ENSUITE',
      furnished: true,
      utilitiesIncluded: true,
      minStayMonths: 6,
      availableFrom: new Date(),
      rules: {
        guests: 'OCCASIONAL',
        quietHours: '11PM',
        smoking: 'NO',
        pets: 'NO_PETS',
      },
      photos: ['https://via.placeholder.com/800x600'],
    },
  })

  console.log('Seed data created!')
}

seed().then(() => prisma.$disconnect())
```

Run: `npx tsx scripts/seed.ts`

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in Vercel
- [ ] Database migrations run
- [ ] Test Smile ID webhook endpoint
- [ ] Test Paystack webhook endpoint
- [ ] Error tracking configured (Sentry)

### Post-Deployment
- [ ] Test signup/login flow
- [ ] Test KYC submission
- [ ] Test listing creation
- [ ] Test messaging
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook logs
- [ ] Check Prisma connection

### Monitoring
- Set up alerts for:
  - Failed KYC verifications
  - Failed payments
  - Webhook errors
  - Database connection issues

## Common Issues & Solutions

### Issue: Prisma Client Not Generated
```bash
npm run db:generate
```

### Issue: Database Connection Failed
- Check DATABASE_URL format
- Ensure IP whitelisted in database provider
- Test connection: `npx prisma db push`

### Issue: NextAuth Session Not Working
- Clear cookies
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain

### Issue: Webhooks Not Received
- Use ngrok for local testing: `ngrok http 3000`
- Update callback URLs in Smile ID/Paystack dashboards
- Check webhook signature verification

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Smile ID API**: https://docs.usesmileid.com
- **Paystack API**: https://paystack.com/docs/api
- **Pusher Docs**: https://pusher.com/docs

## Getting Help

If stuck:
1. Check error logs in terminal
2. Inspect network tab for API errors
3. Review Prisma Studio for data issues
4. Check this implementation guide
5. Refer to README for architecture overview

Good luck! 🚀
