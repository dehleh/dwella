# Dwella MVP - Quick Start Guide

This guide will get you up and running with Dwella locally in under 30 minutes.

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm or yarn installed
- ✅ PostgreSQL installed locally OR access to a cloud database
- ✅ Git installed

## Step 1: Database Setup

### Option A: Local PostgreSQL (Mac/Linux)

```bash
# Install PostgreSQL (Mac)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb dwella_db

# Your DATABASE_URL will be:
# postgresql://localhost:5432/dwella_db
```

### Option B: Cloud Database (Recommended for Solo Founders)

Use one of these free tiers:
- **Railway**: railway.app (easiest)
- **Supabase**: supabase.com (includes auth)
- **Neon**: neon.tech (serverless Postgres)

1. Sign up for Railway
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from the connection tab

## Step 2: Project Setup

```bash
# Navigate to project directory
cd dwella-mvp

# Install dependencies
npm install

# This installs:
# - Next.js 14
# - Prisma ORM
# - Tailwind CSS
# - TypeScript
# - All utilities
```

## Step 3: Environment Configuration

```bash
# Create environment file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Required for MVP to run
DATABASE_URL="postgresql://user:password@host:5432/dwella_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"

# Optional for MVP (can add later)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxx"
PAYSTACK_SECRET_KEY="sk_test_xxxxx"
KYC_PROVIDER="smile_identity"
SMILE_IDENTITY_PARTNER_ID="your-partner-id"
SMILE_IDENTITY_API_KEY="your-api-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### Generate NEXTAUTH_SECRET

```bash
# Mac/Linux
openssl rand -base64 32

# Or use this online: https://generate-secret.vercel.app/32
```

## Step 4: Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# Optional: Open Prisma Studio to view database
npx prisma studio
# Visit http://localhost:5555
```

This creates 14 tables:
- users, user_profiles
- verification_requests, verification_artifacts
- preferences, listings
- conversations, messages, blocks
- unlock_requests, payment_transactions, contact_reveals
- viewings, reports
- admin_action_logs

## Step 5: Run Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

You should see the Dwella landing page!

## Step 6: Test the Flow

### A. Create an Account

1. Click "Sign up" → http://localhost:3000/signup
2. Enter email/password
3. Select role: "Find Room" (seeker)
4. Submit

### B. Test API Endpoints

Using Postman or curl:

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "seeker"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned `token` for authenticated requests.

**Create Listing (as host):**
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "city": "Lagos",
    "neighborhood": "Lekki",
    "priceMonthly": 150000,
    "roomType": "ENSUITE",
    "furnished": true,
    "utilitiesIncluded": true,
    "minStayMonths": 3,
    "availableFrom": "2025-03-01",
    "rules": {
      "guests": "occasional",
      "smoking": "no"
    }
  }'
```

**Browse Listings:**
```bash
curl http://localhost:3000/api/listings?city=Lagos
```

## Step 7: View Database

```bash
# Open Prisma Studio
npx prisma studio
```

Browse your data at http://localhost:5555

## Common Issues & Solutions

### Issue: "Can't reach database"

**Solution:**
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running: `brew services list` (Mac)
- Test connection: `psql $DATABASE_URL`

### Issue: "Module not found"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Prisma Client did not generate"

**Solution:**
```bash
npx prisma generate
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or run on different port
npm run dev -- -p 3001
```

## Next Steps

Now that your local environment is running:

### Immediate (Week 1)
1. ✅ Test signup/login flow
2. ⬜ Implement login page (copy from signup)
3. ⬜ Add KYC integration (Smile Identity)
4. ⬜ Add Paystack for payments

### Short-term (Week 2-3)
1. ⬜ Build messaging system
2. ⬜ Build contact unlock flow
3. ⬜ Create basic admin console
4. ⬜ Add file upload (Cloudinary)

### Medium-term (Month 1)
1. ⬜ Get 10-20 beta users
2. ⬜ Iterate based on feedback
3. ⬜ Write tests
4. ⬜ Deploy to production

## Development Tips

### Hot Reloading
Next.js automatically reloads when you save files. No restart needed!

### Database Changes
When you modify `prisma/schema.prisma`:
```bash
npx prisma db push  # Update database
npx prisma generate # Regenerate client
```

### TypeScript
The project is fully typed. Your editor (VS Code) will show errors immediately.

### Debugging
```bash
# View logs
npm run dev

# Debug specific API routes
# Add console.log() in app/api/**/*.ts
```

## Helpful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Visual database editor
npx prisma db push   # Update database schema
npx prisma generate  # Regenerate Prisma Client
npx prisma migrate dev --name init  # Create migration

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

## Getting Help

If you're stuck:

1. Check this guide again
2. Check [README.md](./README.md) for architecture overview
3. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
4. Review the PRD document for requirements
5. Search the codebase for examples

## File Locations

- **API Routes**: `app/api/`
- **Pages**: `app/*/page.tsx`
- **Components**: `components/`
- **Database Logic**: `lib/prisma.ts`
- **Validation**: `lib/validations.ts`
- **Matching**: `lib/matching.ts`
- **Schema**: `prisma/schema.prisma`

---

**You're all set!** 🎉

Your Dwella MVP is now running locally. Start building!
