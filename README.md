# 🔗 Relay App

Event lead generation through creditable referrals. Built with Next.js 15 + TypeScript + Tailwind CSS + Supabase + SMTP.com.

## Tech Stack

- **Next.js 15** (App Router + Turbopack)
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **@supabase/supabase-js**
- **nanoid** (for short referral codes)
- **nodemailer** (SMTP email)

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Tenant
TENANT_SLUG=nexium-digital

# SMTP (SMTP.com)
SMTP_HOST=send.smtp.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Relay App

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `db/schema.sql`
3. Your tables are ready!

## API Endpoints

### Core
| Endpoint | Description |
|----------|-------------|
| `POST /api/register` | Public registration with referral tracking |
| `GET/POST /api/events` | Event management |
| `GET /api/events/:id/analytics` | Event statistics |
| `GET /api/events/:id/leaderboard` | Top referrers |
| `GET /api/events/:id/tree/:userId` | Referral network |

### Referrals & Credits
| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/referral-links` | Manage referral codes |
| `GET /api/credits/:userId` | User credit balance |
| `GET/POST /api/perks` | List/create perks |
| `POST /api/perks/claim` | Redeem perks |

### Analytics
| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/link-clicks` | Click tracking & analytics |

### Redirect
| Endpoint | Description |
|----------|-------------|
| `GET /r/:eventId/:code` | Referral link redirect |

## Features

- ✅ Multi-tenant SaaS architecture
- ✅ Auto-generated referral codes (nanoid)
- ✅ Credit system with auto-awards
- ✅ Multi-level referral chain tracking
- ✅ Event lifecycle management
- ✅ Leaderboard & gamification
- ✅ Analytics & conversion rates
- ✅ Perk redemption system
- ✅ Detailed click tracking
- ✅ Fraud protection (IP hashing, limits)
- ✅ SMTP.com email integration
- ✅ Automated email notifications

## Email Templates

- Registration confirmation
- Referral notification
- Perk claimed confirmation

## Deploy

```bash
vercel --prod
```

## Database Schema

### Tables
- `tenants` - Organizations
- `users` - People
- `events` - Events with referral config
- `referral_links` - Trackable codes
- `registrations` - Event sign-ups
- `referral_chain` - Multi-level tracking
- `credits` - Points/rewards
- `perks` - Redeemable rewards
- `perk_claims` - User redemptions
- `link_clicks` - Click analytics

---
Built by NexiumDigital
