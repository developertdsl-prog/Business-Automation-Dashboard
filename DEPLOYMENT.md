# Deployment Guide — Business Automation Dashboard

## Overview
Deploy the Business Automation Dashboard to production using Docker, Railway, Render, or any cloud platform.

## Prerequisites
- PostgreSQL database (hosted or self-managed)
- Redis instance (for BullMQ job queue)
- Domain name with SSL
- GitHub repository connected to your deployment platform

## Environment Variables

Create a `.env` file with the following:

```bash
# Next.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Redis (for BullMQ)
REDIS_URL="redis://host:6379"

# Webhook security
WEBHOOK_SECRET=your-webhook-signing-secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Deployment Options

### Option 1: Railway (Recommended)

1. Connect your GitHub repo to Railway
2. Add PostgreSQL and Redis services
3. Add environment variables from `.env`
4. Deploy — Railway auto-detects Next.js

### Option 2: Render

1. Create a new Web Service from your GitHub repo
2. Add PostgreSQL and Redis as separate services
3. Set environment variables
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`

### Option 3: Docker (Self-Hosted)

```bash
# Clone the repo
git clone https://github.com/developertdsl-prog/Business-Automation-Dashboard.git
cd Business-Automation-Dashboard

# Copy env and configure
cp .env.example .env
# Edit .env with your values

# Start with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## Production Checklist

- [ ] `NEXTAUTH_SECRET` is set to a strong random value
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `REDIS_URL` points to production Redis
- [ ] `WEBHOOK_SECRET` is set for webhook signature verification
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] Database migrations have been run (`prisma db push`)
- [ ] GitHub token has `workflow` scope for CI/CD
- [ ] Branch protection rules are enabled on `dev` and `main`

## Beta Testing

1. Deploy to a staging environment first
2. Invite 3–5 pilot users
3. Test the following flows:
   - User sign-up and sign-in
   - Create and activate a scheduled workflow
   - Create and trigger a webhook workflow
   - View execution logs
   - Receive failure notifications
4. Collect feedback and fix bugs
5. Tag a release: `git tag v1.0.0`
6. Create a GitHub Release from the tag

## Monitoring

- Application logs: `docker-compose logs -f app`
- Worker logs: Check Redis queue and BullMQ dashboard
- Database: Connect via your PostgreSQL client
- Errors: Set up Sentry or similar error tracking

## Release Process

1. Merge feature branches into `dev` via PR
2. Test thoroughly on `dev`
3. Create release PR from `dev` to `main`
4. Tag the release: `git tag v1.0.0 && git push --tags`
5. Create GitHub Release with changelog
