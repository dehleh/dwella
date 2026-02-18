# Dwella MVP - Production Deployment Guide

This guide walks you through deploying Dwella to production using free or low-cost services.

## Recommended Stack

- **Frontend + API**: Vercel (free tier)
- **Database**: Railway or Render (free tier)
- **File Storage**: Cloudinary (free tier)
- **Domain**: Namecheap / GoDaddy (~$15/year)

Total estimated cost: **$0-15/month** for first 1000 users

## Prerequisites

- GitHub account (to connect with Vercel)
- Domain name (optional but recommended)
- Payment method for KYC and payment providers

## Part 1: Database Setup (Railway)

Railway offers free PostgreSQL with 500 hours/month (enough for MVP).

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Provision PostgreSQL"
5. Wait for database to provision (~30 seconds)

### Step 2: Get Database URL

1. Click on your PostgreSQL service
2. Go to "Connect" tab
3. Copy the "Postgres Connection URL"
4. It looks like: `postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway`

### Step 3: Run Migration

From your local machine:

```bash
# Set the production database URL temporarily
export DATABASE_URL="your-railway-postgres-url"

# Push schema to production database
npx prisma db push

# Verify it worked
npx prisma studio
```

**Important**: Don't commit DATABASE_URL to git!

## Part 2: Frontend Deployment (Vercel)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Dwella MVP"

# Create GitHub repo at github.com/new

# Push to GitHub
git remote add origin https://github.com/yourusername/dwella-mvp.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your `dwella-mvp` repository
5. Configure build settings (Vercel auto-detects Next.js)

### Step 3: Add Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables

Add all variables from `.env`:

```env
# Database
DATABASE_URL=postgresql://... (from Railway)

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# KYC
KYC_PROVIDER=smile_identity
SMILE_IDENTITY_PARTNER_ID=your-partner-id
SMILE_IDENTITY_API_KEY=your-api-key
SMILE_IDENTITY_CALLBACK_URL=https://your-app.vercel.app/api/webhooks/kyc

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

**Important**: Use production keys, not test keys!

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Your app is live at: `https://your-app.vercel.app`

## Part 3: Custom Domain Setup

### Option A: Use Vercel Domain (Free)

Your app is available at: `your-app.vercel.app`

This works but looks unprofessional.

### Option B: Custom Domain (Recommended)

1. Buy domain at Namecheap/GoDaddy (~$15/year)
   - Suggested: `dwella.ng` or `usedwella.com`

2. In Vercel → Settings → Domains:
   - Add your domain: `dwella.ng`
   - Add www subdomain: `www.dwella.ng`

3. Update DNS records at your registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Wait 10-30 minutes for DNS propagation
5. Vercel automatically provisions SSL certificate

## Part 4: External Services Setup

### A. Paystack (Payment Provider)

1. Sign up at [paystack.com](https://paystack.com)
2. Complete business verification (required in Nigeria)
3. Get API keys from Settings → API Keys & Webhooks
4. Update environment variables in Vercel:
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
5. Set webhook URL: `https://yourdomain.com/api/webhooks/paystack`

### B. Smile Identity (KYC Provider)

1. Sign up at [usesmileid.com](https://usesmileid.com)
2. Complete partner onboarding
3. Get credentials from dashboard
4. Update environment variables:
   - `SMILE_IDENTITY_PARTNER_ID`
   - `SMILE_IDENTITY_API_KEY`
5. Configure callback URL: `https://yourdomain.com/api/webhooks/kyc`

Alternative: **Youverify** (youverify.co) - Nigerian KYC provider

### C. Cloudinary (Image Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Free tier: 25 GB storage, 25 GB bandwidth/month
3. Get credentials from Dashboard
4. Update environment variables:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Part 5: Post-Deployment Checklist

### Immediately After Deploy

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test listing creation
- [ ] Test browsing listings
- [ ] Check all environment variables are set
- [ ] Test on mobile device
- [ ] Check SSL certificate is active (https://)

### Within 24 Hours

- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (Google Analytics or Plausible)
- [ ] Test Paystack webhook (create test payment)
- [ ] Test KYC flow with real ID
- [ ] Set up backups for database
- [ ] Configure custom email (admin@dwella.ng)

### Within 1 Week

- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add Safety Guidelines page
- [ ] Create admin account
- [ ] Test full user journey end-to-end
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure rate limiting

## Part 6: Monitoring & Maintenance

### Vercel Analytics

Free built-in analytics:
- Pageviews
- Top pages
- User locations
- Performance metrics

Access: Vercel Dashboard → Analytics

### Database Monitoring

Railway provides:
- CPU usage
- Memory usage
- Disk space
- Connection count

Access: Railway Dashboard → Your PostgreSQL

### Error Tracking (Optional)

Add Sentry for error monitoring:

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig({
  // your existing config
}, {
  silent: true,
  org: "your-org",
  project: "dwella-mvp",
})
```

### Uptime Monitoring

Use UptimeRobot (free):
1. Create account at uptimerobot.com
2. Add monitor for your domain
3. Get alerts if site goes down
4. Set check interval: 5 minutes

## Part 7: Scaling Considerations

### When to Upgrade

**Free tier limits:**
- Vercel: 100 GB bandwidth/month
- Railway: 500 hours/month = ~20 days
- Cloudinary: 25 GB bandwidth/month

**Upgrade when:**
- 1000+ active users
- 10,000+ page views/month
- Database usage > 80%

### Scaling Path

1. **1-1000 users**: Free tier (Current setup)
2. **1000-5000 users**: 
   - Railway Pro ($5/month)
   - Vercel Pro ($20/month)
3. **5000+ users**:
   - Dedicated database (AWS RDS ~$25/month)
   - Vercel Pro + additional bandwidth
   - Consider adding Redis for caching

## Part 8: Security Checklist

Before going live:

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured properly
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] Input validation on all API routes
- [ ] Webhook signature verification
- [ ] Admin routes protected
- [ ] Sensitive data encrypted at rest

## Part 9: Backup Strategy

### Database Backups

Railway automatic backups:
- Daily snapshots (kept for 7 days)
- Manual backups available

To create manual backup:
```bash
# Download backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250215.sql
```

### Code Backups

- GitHub is your backup
- Tag releases: `git tag v1.0.0 && git push --tags`
- Keep Vercel deployments (auto-saved for 30 days)

## Part 10: Go-Live Checklist

Final checks before announcing launch:

- [ ] All features tested in production
- [ ] Payment flow works end-to-end
- [ ] KYC verification works
- [ ] Custom domain working
- [ ] SSL certificate valid
- [ ] Email notifications configured
- [ ] Terms & Privacy pages live
- [ ] Contact information updated
- [ ] Social media accounts created
- [ ] Launch announcement ready
- [ ] Support email set up (support@dwella.ng)
- [ ] Database backed up
- [ ] Monitoring tools active

## Troubleshooting

### Build Fails on Vercel

**Error**: "Module not found"

**Fix**:
```bash
# Ensure all dependencies in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Database Connection Issues

**Error**: "Can't reach database server"

**Fix**:
- Check DATABASE_URL in Vercel env vars
- Ensure Railway database is running
- Check Railway doesn't require IP whitelist

### SSL/HTTPS Not Working

**Fix**:
- Wait 30 minutes after domain setup
- Ensure DNS records are correct
- Check domain verification in Vercel

### Webhook Not Receiving Events

**Fix**:
- Verify webhook URL is correct
- Check it ends with `/api/webhooks/[provider]`
- Ensure route handler is deployed
- Check webhook logs in provider dashboard

## Cost Breakdown

### Free Tier (0-1000 users)
- Vercel: $0
- Railway: $0
- Cloudinary: $0
- Domain: $15/year
- **Total**: $15/year ($1.25/month)

### Pro Tier (1000-5000 users)
- Vercel Pro: $20/month
- Railway Pro: $5/month
- Cloudinary: $0 (likely still under limits)
- Domain: $15/year
- **Total**: ~$26/month

### Growth Tier (5000+ users)
- Vercel Pro: $20/month
- AWS RDS: $25/month
- Cloudinary: $89/month (likely needed)
- CDN: $10/month
- **Total**: ~$145/month

---

## Next Steps After Deployment

1. Share with 10 beta users
2. Collect feedback
3. Fix critical bugs
4. Add analytics tracking
5. Start marketing
6. Plan v1 features

**Congratulations! Dwella is now live! 🎉**

For questions: tech@dwella.ng
