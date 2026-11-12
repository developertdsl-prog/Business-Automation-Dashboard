# Business Automation Dashboard

Next.js 14 + Prisma + PostgreSQL starter for a business automation dashboard.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials provider)
- **Styling:** Tailwind CSS
- **Validation:** Zod + React Hook Form
- **Language:** TypeScript

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your database URL and NextAuth secret.

### 3. Set up the database
```bash
npx prisma db push
npx prisma db generate
```

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Git Workflow (dev-based)

- Base branch: `dev`
- Create feature branches from `dev`: `git checkout -b feat/your-feature`
- Push and open PR: `feat/your-feature` → `dev`
- Squash and merge, delete feature branch
- Never commit directly to `dev` or `main`

## Security
Never commit `.env` or real secrets. Use `.env.example` for placeholders and GitHub Secrets for CI/CD.