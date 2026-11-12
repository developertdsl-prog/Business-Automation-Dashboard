# Business Automation Dashboard — Project Plan

> **Status:** Draft (v1.0)  
> **Owner:** Project Team  
> **Last updated:** Thu Nov 12 2026

---

## 1. Executive Summary

Build a web-based dashboard that gives business owners and operations teams a single pane of glass to monitor, trigger, and manage automated business processes (leads, invoicing, approvals, reporting, integrations) across their stack.

**Core value proposition:** Reduce manual work, surface bottlenecks in real time, and give non-technical users control over automation rules without writing code.

---

## 2. Goals & Success Metrics

| Goal | Success Metric |
|------|----------------|
| Centralized visibility into automations | 100% of active workflows visible on one dashboard |
| Reduce manual data entry | 50% reduction in repetitive admin tasks within 3 months |
| Non-technical workflow configuration | Business users can create/edit 80% of rules without developer help |
| Reliable execution | 99.5%+ workflow success rate |
| Fast performance | Dashboard loads < 3s on standard broadband |

---

## 3. Scope

### In Scope (MVP)
- User authentication & role-based access control (Admin, Manager, Viewer)
- Dashboard home with KPI cards and recent activity feed
- Workflow library / marketplace (pre-built templates)
- Visual workflow builder (drag-and-drop nodes: trigger → action → condition)
- Execution history & logs per workflow
- Integrations: email (SMTP), Slack webhook, Google Sheets, REST API webhook
- Scheduled and event-driven triggers
- Manual "Run Now" button for workflows
- Notifications (in-app + email) on failure/success
- Basic audit log

### Out of Scope (v2+)
- Mobile native apps
- White-label / multi-tenant SaaS billing
- AI-powered workflow suggestions
- Complex branching (loops, parallel gates) — MVP supports linear + if/else
- On-premise deployment

---

## 4. User Personas

| Persona | Needs | Primary Actions |
|---------|-------|-----------------|
| **Business Owner** | High-level health of automations, ROI | View KPIs, enable/disable workflows, review reports |
| **Operations Manager** | Build and monitor processes | Create workflows, fix failed runs, assign owners |
| **Finance / Admin** | Data accuracy, invoice/approval flows | Trigger invoice workflows, review logs |
| **Viewer (Read-only)** | Visibility only | View dashboard, export reports |

---

## 5. Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript + Vite | Fast, type-safe, large ecosystem |
| UI Components | Tailwind CSS + shadcn/ui or MUI | Rapid UI development, accessible |
| State Management | TanStack Query (server) + Zustand (client) | Cache API data, simple global state |
| Forms | React Hook Form + Zod | Validation-heavy workflow builder |
| Backend | Node.js + NestJS or Express + TypeScript | Type-safe end-to-end, good for async jobs |
| Task Queue / Automation Engine | BullMQ + Redis (or in-memory for MVP) | Reliable background job execution |
| Database | PostgreSQL + Prisma ORM | Relational data for workflows, runs, audit logs |
| Auth | NextAuth.js / Clerk / Auth0 (OAuth + JWT) | Secure, fast to integrate |
| File Storage | AWS S3 / Cloudflare R2 | Store workflow exports, logs, attachments |
| Deployment | Docker + Railway / Render / AWS | Containerized, easy CI/CD |
| Monitoring | Sentry + Logtail / Grafana | Error tracking, job monitoring |

> **Tip:** If you want to move fastest, consider Next.js (App Router) for full-stack in one repo, with Prisma + PostgreSQL and BullMQ for background jobs.

---

## 6. High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React UI  │◄────►│  API (Node)  │◄────►│  PostgreSQL     │
│  (Vite)     │ REST │  (NestJS)    │      │  (Prisma)       │
└─────────────┘      └──────────────┘      └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Redis      │◄────┐
                        │  (BullMQ)    │     │
                        └──────────────┘     │
                               │             │
                               ▼             │
                        ┌──────────────┐     │
                        │ Worker(s)    │─────┼─► External APIs
                        │ (execute     │     │  (Slack, Email, Sheets...)
                        │  workflows)  │
                        └──────────────┘
```

### Data Flow
1. User creates/edits a workflow in the UI → saved to PostgreSQL (`workflows`, `workflow_nodes`, `workflow_edges` tables).
2. User enables schedule or trigger → worker picks up due jobs from BullMQ.
3. Worker executes node-by-node, writes each run to `workflow_runs` and `run_steps` tables.
4. Results pushed back via WebSocket/polling to the dashboard UI.
5. Failures alerted via in-app notification + email.

---

## 7. Database Schema (Prisma-style)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      UserRole @default(VIEWER)
  workflows Workflow[]
  runs      WorkflowRun[]
  createdAt DateTime @default(now())
}

enum UserRole { ADMIN MANAGER VIEWER }

model Workflow {
  id          String        @id @default(uuid())
  name        String
  description String?
  isActive    Boolean       @default(false)
  triggerType TriggerType   // SCHEDULE | WEBHOOK | MANUAL
  cron        String?       // e.g. "0 9 * * *"
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id])
  nodes       WorkflowNode[]
  edges       WorkflowEdge[]
  runs        WorkflowRun[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum TriggerType { SCHEDULE WEBHOOK MANUAL }

model WorkflowNode {
  id        String   @id @default(uuid())
  workflowId String
  workflow  Workflow @relation(fields: [workflowId], references: [id])
  type      String   // TRIGGER | ACTION | CONDITION | DELAY
  config    Json     // node-specific settings (e.g. email template, HTTP method)
  positionX Float
  positionY Float
  edgesFrom Edge[]   @relation("edgesFrom")
  edgesTo   Edge[]   @relation("edgesTo")
}

model WorkflowEdge {
  id           String   @id @default(uuid())
  workflowId   String
  sourceNodeId String
  targetNodeId String
  from         WorkflowNode @relation("edgesFrom", fields: [sourceNodeId], references: [id])
  to           WorkflowNode @relation("edgesTo", fields: [targetNodeId], references: [id])
  condition    String?    // for conditional branching
}

model WorkflowRun {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])
  status      RunStatus // PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
  startedAt   DateTime?
  completedAt DateTime?
  triggerPayload Json?
  error       String?
  steps       RunStep[]
  createdAt   DateTime @default(now())
}

enum RunStatus { PENDING RUNNING COMPLETED FAILED CANCELLED }

model RunStep {
  id        String   @id @default(uuid())
  runId     String
  run       WorkflowRun @relation(fields: [runId], references: [id])
  nodeId    String
  nodeType  String
  status    RunStatus
  input     Json?
  output    Json?
  error     String?
  startedAt DateTime?
  completedAt DateTime?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String   // WORKFLOW_CREATE, WORKFLOW_TOGGLE, RUN_TRIGGER, etc.
  entityType String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())
}
```

---

## 8. Feature Roadmap

### Phase 1 — Foundation (Weeks 1–2)
- Repo setup, CI/CD, Docker, linting, testing config
- Auth (login, register, roles)
- Database schema + Prisma migrations
- API: CRUD for users & workflows (read-only)

### Phase 2 — Core Dashboard (Weeks 3–5)
- KPI cards (active workflows, runs today, success rate, failures)
- Workflow list view (table with search, filters, status badges)
- Workflow detail view (graph visualization of nodes/edges)
- Manual run trigger + execution history table
- Basic notifications (toast + in-app bell)

### Phase 3 — Workflow Builder (Weeks 6–9)
- Drag-and-drop canvas (React Flow or custom SVG)
- Node library: Trigger (Schedule, Webhook, Manual), Action (Email, Slack, HTTP, Google Sheets), Condition (If/Else), Delay
- Save/load workflow JSON
- Validate workflow before activation
- Toggle active/inactive

### Phase 4 — Automation Engine (Weeks 10–12)
- BullMQ workers + Redis
- Scheduler (cron-based)
- Step-by-step execution with retry logic (exponential backoff)
- Run logs per step (input/output/error)
- Failure alerts (email + in-app)

### Phase 5 — Integrations & Polish (Weeks 13–15)
- OAuth connectors (Google, Slack)
- Webhook endpoint to receive external events
- Export workflow JSON / import from template
- Audit log page
- Performance tuning, E2E tests (Playwright/Cypress)

### Phase 6 — Launch (Week 16)
- Beta with 3–5 pilot users
- Feedback loop, bug fixes
- Production deployment

---

## 9. API Endpoint Plan

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Create account |
| GET | `/auth/me` | Current user profile |
| GET | `/workflows` | List workflows (with filters) |
| POST | `/workflows` | Create workflow |
| GET | `/workflows/:id` | Get workflow detail + nodes/edges |
| PUT | `/workflows/:id` | Update workflow |
| DELETE | `/workflows/:id` | Delete workflow |
| POST | `/workflows/:id/toggle` | Activate/deactivate |
| POST | `/workflows/:id/run` | Manual trigger |
| GET | `/workflows/:id/runs` | Execution history |
| GET | `/runs/:runId/steps` | Step logs for a run |
| GET | `/dashboard/stats` | KPI aggregates |
| GET | `/notifications` | User notifications |
| POST | `/webhooks/:workflowId` | External webhook receiver |

---

## 10. Frontend Page Map

```
/ (public)          → Login / Landing
/dashboard          → Home: KPIs, recent activity, quick actions
/workflows          → Workflow library (list + grid)
/workflows/new      → Create workflow (canvas builder)
/workflows/:id      → Workflow detail (graph, settings, runs)
/workflows/:id/runs → Execution history
/runs/:runId        → Single run step-by-step log
/integrations       → Connected accounts (Slack, Google, etc.)
/settings           → Profile, team, billing (v2)
/audit-log          → Admin audit trail
```

---

## 11. Key Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Workflow runs infinitely / hangs | High | Timeout per step (e.g. 30s), max retries, circuit breaker |
| Failed integrations (API down) | Medium | Retry queue with dead-letter, alert on repeated failure |
| Security: webhook spoofing | High | HMAC signature validation, rate limiting |
| Performance: large run logs | Medium | Pagination, archive old runs (>90 days) |
| Non-technical users struggle with builder | Medium | Pre-built templates, guided onboarding, tooltips |

---

## 12. Definition of Done (MVP)

- [ ] User can sign up, log in, and see dashboard
- [ ] User can create a scheduled workflow (e.g. "send daily summary email at 9am")
- [ ] Workflow executes in background without UI blocking
- [ ] User can view run history and step logs
- [ ] Failed runs surface an error message and notification
- [ ] Admin can toggle any workflow on/off
- [ ] All API endpoints have tests; critical paths have E2E tests
- [ ] Deployed to staging with HTTPS

---

## 13. Next Steps (Immediate)

1. **Confirm tech stack** — React vs Next.js, self-hosted vs managed auth, etc.
2. **Initialize repo** — `git init`, choose package manager, set up CI.
3. **Define first 3 workflow templates** — e.g. Lead Follow-up, Invoice Reminder, Daily Slack Digest.
4. **Schedule kickoff** — assign owner, designer, backend, frontend.

---

## Appendix: Suggested File Structure

```
business-automation-dashboard/
├── apps/
│   ├── web/                # React frontend (Vite)
│   └── api/                # Node/NestJS backend
├── packages/
│   ├── shared/             # Shared types, schemas, constants
│   └── ui/                 # Shared component library (optional)
├── infra/                  # Docker, docker-compose, k8s manifests
├── docs/                   # Architecture, API specs, runbooks
├── docker-compose.yml
├── package.json            # workspace root
└── README.md
```

---

**Questions to answer before starting:**
1. Do you prefer a full-stack Next.js app or separate frontend/backend repos?
2. Which integrations are must-have for v1 (Slack, email, Google Sheets, etc.)?
3. Will this be self-hosted or deployed to a cloud platform?
4. Do you need multi-tenant (multiple companies) or single-company?

Once you confirm those, I can generate the starter repo structure, database schema, and first sprint tasks.

---

## 14. GitHub Project Management Plan

> **Golden rule:** `dev` is the base integration branch. `main` is for production releases only.  
> **Never commit directly to `dev` or `main`.** All work happens on separate feature branches created from `dev`, then merged via Pull Request.

---

### 14.1 Branch Strategy (dev-based)

| Branch | Purpose | Created from | Merged into |
|--------|---------|--------------|-------------|
| `main` | Production-ready code only | `dev` (via release PR) | — (protected) |
| `dev` | Integration / staging base | `main` (initial) | `main` (releases) |
| `feat/*` | New features | `dev` | `dev` |
| `fix/*` | Bug fixes | `dev` | `dev` |
| `chore/*` | Tooling, config, deps | `dev` | `dev` |
| `refactor/*` | Code cleanup (no behavior change) | `dev` | `dev` |
| `docs/*` | Documentation only | `dev` | `dev` |
| `release/v1.0.0` | Release preparation | `dev` | `main` + `dev` |

**Naming convention:** `<type>/<short-description>`  
Examples: `feat/dashboard-kpis`, `fix/webhook-signature-validation`, `chore/setup-prisma`, `docs/api-endpoints`

**Standard workflow for every task:**

```bash
# 1. Start from latest dev
git checkout dev
git pull origin dev

# 2. Create feature branch from dev
git checkout -b feat/dashboard-kpis

# 3. Do work, commit, push
git add .
git commit -m "feat: add dashboard KPI cards"
git push -u origin feat/dashboard-kpis

# 4. Open Pull Request on GitHub: feat/dashboard-kpis → dev
# 5. Review, pass checks, merge via Squash and merge
# 6. Delete feature branch after merge
```

---

### 14.2 Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) so Git history and changelogs are clean:

```
<type>(<scope>): <description>

[optional body]

[optional footer: Closes #issue-number]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`

Examples:
- `feat(api): add workflow CRUD endpoints`
- `fix(web): resolve KPI card overflow on mobile`
- `chore(deps): update prisma to latest`
- `docs(readme): add local setup instructions` Closes #12

**Rules:**
- One logical change per commit.
- Never commit secrets (tokens, keys, `.env` values).
- Always reference an issue number when closing work: `Closes #42` or `Refs #42`.

---

### 14.3 Issues (Plan All Work Here)

Create a GitHub Issue for **every** task, bug, or feature before coding. Never do "off-board" work.

**Issue template fields:**
- Title: clear, starts with feature/bug/chore
- Labels: `bug`, `feature`, `enhancement`, `docs`, `chore`, `priority-high`, `priority-medium`, `priority-low`, `frontend`, `backend`, `devops`
- Assignee: the person doing the work
- Milestone: the release/milestone it belongs to
- Description: acceptance criteria, steps to reproduce (for bugs), linked design notes
- Projects: add to the GitHub Project board

**Issue → Branch → PR link chain:**
```
Issue #15  →  branch feat/login-page  →  PR #18  →  merge to dev  →  closes #15
```

Always reference the issue in the branch name and PR title, and close it with `Closes #15` in the merge commit.

---

### 14.4 Milestones (Group Issues by Release)

Map milestones to the project phases:

| Milestone | Target | Issues included |
|-----------|--------|-----------------|
| `MVP v1.0 - Foundation` | Week 2 | Repo setup, auth, DB schema, CI/CD |
| `MVP v1.0 - Core Dashboard` | Week 5 | KPI cards, workflow list, run history |
| `MVP v1.0 - Workflow Builder` | Week 9 | Drag-and-drop canvas, node library, activation |
| `MVP v1.0 - Automation Engine` | Week 12 | BullMQ workers, scheduler, retries, alerts |
| `MVP v1.0 - Integrations & Launch` | Week 16 | OAuth, webhooks, audit log, beta deploy |

**How to use milestones:**
1. Create milestone in GitHub → set due date → add description.
2. Assign every issue to a milestone.
3. Track progress on the milestone page (GitHub shows % complete automatically).
4. Close milestone when all issues are merged and release is tagged.

---

### 14.5 Pull Request (PR) Workflow

1. Push feature branch to GitHub.
2. Open PR: `feat/xxx` → `dev`.
3. PR template should include:
   - What changed
   - Related issue number (`Closes #xx`)
   - Screenshots (for UI)
   - Checklist: tests pass, lint passes, docs updated
4. Require **at least 1 approval** before merge.
5. Require status checks (CI/build/tests) to pass.
6. Merge method: **Squash and merge** (keeps `dev` history clean).
7. Delete the feature branch after merge.
8. Only repo maintainers merge to `dev`; `main` is updated only via release PR.

---

### 14.6 GitHub Project Board (Kanban)

Use **GitHub Projects** (board view) with these columns:

- `Backlog` — issues not yet started
- `To Do` — planned for current milestone/sprint
- `In Progress` — branch created, work active
- `In Review` — PR open, waiting for approval
- `Done` — merged to `dev`

Move issues across columns as work progresses. This gives visible activity on GitHub.

---

### 14.7 Branch Protection Rules (Set in GitHub Settings)

Protect both `dev` and `main`:

- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require status checks to pass (CI/build/tests)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict pushes to `dev`/`main` (no direct pushes)

---

### 14.8 Security — Never Commit Tokens or Secrets

**Do NOT save your GitHub token, API keys, database URLs, or passwords in any file inside the repo.** Even if you mentioned saving a token in the plan, remove it immediately.

**Correct way to handle secrets:**

1. Create `.env.example` (safe to commit) with placeholder values:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/db"
   GITHUB_TOKEN="your_github_token_here"
   JWT_SECRET="change-me"
   ```

2. Create `.env.local` or `.env` (never commit) with real values.

3. Add to `.gitignore`:
   ```
   .env
   .env.local
   *.log
   node_modules/
   ```

4. For CI/CD, store secrets in **GitHub Settings → Secrets and variables → Actions** (e.g. `GH_TOKEN`, `DATABASE_URL`). GitHub Actions can reference them without exposing them in logs.

5. If you accidentally committed a token, treat it as compromised: revoke it immediately and generate a new one.

---

### 14.12 `.gitignore` — What stays OFF GitHub

A `.gitignore` file is included at the repo root. It blocks:

- **`node_modules/`** — dependencies (reinstalled via `npm install`)
- **`.env`, `.env.local`, `*.env`** — secrets and local config (commit only `.env.example` if you want)
- **`dist/`, `build/`, `.next/`** — compiled output (generated at build time)
- **`coverage/`**, test reports, screenshots — CI artifacts
- **`.idea/`, `.vscode/***` — IDE settings (except recommended extensions)
- **`*.log`, `npm-debug.log*`** — runtime logs
- **`prisma/dev.db`**, `*.sqlite` — local dev databases
- **`.DS_Store`, `Thumbs.db`** — OS junk files

**Rule:** If a file is generated, contains secrets, or is editor-specific, it belongs in `.gitignore`, not in GitHub.

---

### 14.9 Releases & Tags

- Tag production releases on `main`: `git tag v1.0.0`
- Create a GitHub Release from the tag with changelog notes.
- Tag only from `main`, never from `dev` or feature branches.

---

### 14.10 Example: First Week of Activity on GitHub

| Day | Action | GitHub artifact |
|-----|--------|-----------------|
| Day 1 | Init repo, add plan | Commit to `main`, then create `dev` |
| Day 1 | Setup project board | GitHub Project: Backlog column |
| Day 2 | Create milestones + issues | Milestone "Foundation", 10 issues |
| Day 3 | Branch `feat/project-setup` from `dev` | Branch, first commits |
| Day 4 | PR `feat/project-setup` → `dev` | PR, review, merge, close issue |
| Day 5 | Repeat for `feat/auth`, `fix/db-schema` | Active issue/branch/PR history |

---

### 14.11 Quick GitHub CLI Reference

```bash
# Create issue
gh issue create --title "Add dashboard KPIs" --body "..." --label feature --milestone 1

# Create branch from dev
git checkout dev && git pull && git checkout -b feat/dashboard-kpis

# Push and open PR
git push -u origin feat/dashboard-kpis
gh pr create --base dev --head feat/dashboard-kpis --title "feat: dashboard KPIs" --body "Closes #15"

# Merge via CLI (after approval)
gh pr merge 15 --squash --delete-branch
```

---

**Next GitHub step:** Create the repo, initialize `main`, create `dev` as the default working branch, add branch protection, then create your first milestone and issues. Once the repo is live, I can generate the exact starter files, `package.json`, Prisma schema, and first sprint issue list for you.