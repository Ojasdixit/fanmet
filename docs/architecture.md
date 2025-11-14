# FanMeet Platform Architecture

## Repository Layout

```
fanmeetfive1900/
├── docs/
│   └── architecture.md        # High-level system design (this file)
├── packages/
│   └── ui/                    # Shared React component library (design system)
├── apps/
│   ├── web/                   # Public marketing site + authenticated dashboards
│   └── api/                   # Node.js (Express) backend API
├── prisma/                    # Prisma schema + migrations (shared by api)
├── package.json               # Root config with npm workspaces
└── tsconfig.base.json         # Shared TypeScript base config
```

## Technology Stack

| Concern              | Choice / Tooling                  | Notes |
|----------------------|-----------------------------------|-------|
| Language             | TypeScript                        | Shared across frontend/backend |
| Frontend framework   | React 18 + Vite                   | Fast dev server, tree-shaking |
| Styling              | Tailwind CSS + CSS variables      | Implements provided design tokens |
| State management     | React Query + Zustand             | Query for server cache, Zustand for UI state |
| Routing              | React Router 7                    | Marketing pages + dashboards |
| Forms & validation   | React Hook Form + Zod             | Consistent validation across tiers |
| Charts               | Recharts                          | Dashboard visualisations |
| Backend framework    | Express 5 + tRPC-style router     | Layered architecture with controllers/services |
| Database ORM         | Prisma ORM                        | PostgreSQL target |
| Authentication       | JWT (access + refresh)            | httpOnly cookies, roles (fan/creator/admin) |
| Real-time            | Socket.IO                         | Live bids, notifications |
| Task queue           | BullMQ (Redis)                    | Email notifications, video session reminders |
| Caching              | Redis                             | Session cache, leaderboard |
| Storage              | AWS S3 compatible (Supabase)      | Creator assets |
| Deployment           | Docker + Render/Fly.io            | Separate services per app |
| Testing              | Vitest (frontend + shared) / Jest (backend) | CI coverage |

## Runtime Architecture

```
[Browser]
   │
   │  HTTPS (REST + WebSocket)
   ▼
[API Gateway / Express]
   │
   ├─ Auth Controller → Auth Service → Prisma (Postgres)
   ├─ Events Controller → Event Service → Prisma
   ├─ Bids Controller → Bid Service → Prisma + Redis (live cache)
   ├─ Notifications Controller → Notification Service → BullMQ → Email/SMS providers
   └─ Admin Controller → Admin Service → Prisma

[Socket.IO]
   └─ Bid updates, countdown timers, notification push
```

### Separation of Concerns
- **Controllers** map HTTP routes to service calls and handle request validation (Zod schemas shared with frontend via `packages/api-types`).
- **Services** encapsulate business logic, orchestrate data access, trigger events.
- **Repositories** (Prisma client) provide data access, separated per domain.
- **Jobs** (BullMQ) run background tasks such as sending emails.

## Authentication & Authorization
- JWT-based auth with refresh tokens stored in secure cookies.
- Role-based access control (RBAC): `FAN`, `CREATOR`, `ADMIN`.
- Middleware to gate route access and inject user context.
- tRPC-like shared type definitions ensure client/server parity.

## API Surface (initial)
- `/auth` (register/login/refresh/logout, OTP verification placeholder)
- `/users` (profile, wallet, notifications)
- `/creators` (apply, approvals, events)
- `/events` (browse, create, update, bidding, featured)
- `/bids` (place, list, history)
- `/meetings` (upcoming, join tokens, video status)
- `/admin/*` (dashboard stats, approvals, payments, featured list)
- `/payments` (wallet balance, transactions, withdrawal requests)
- `/notifications` (mark read, list)

## Frontend Applications
- Single React app with role-specific layouts routed under `/fan`, `/creator`, `/admin`.
- Public marketing pages under `/` including landing and event detail.
- Design system tokens implemented via Tailwind config and CSS variables for consistent theme.

### Routing Overview
```
/
├── (public)
│   ├── /             -> Landing page
│   ├── /events/:id   -> Public event detail (bid summary)
│   └── /auth/*       -> Login / OTP flow
├── /fan/*
│   ├── dashboard     -> Browse events (default)
│   ├── bids          -> My bids (tabs: active/won/lost)
│   ├── meets         -> Upcoming meets
│   ├── wallet        -> Wallet & refunds
│   └── settings      -> Account settings
├── /creator/*
│   ├── overview
│   ├── events
│   ├── events/new    -> Create event
│   ├── earnings
│   ├── withdrawals
│   ├── meets
│   └── settings
└── /admin/*
    ├── dashboard
    ├── users
    ├── creators
    ├── events
    ├── payments
    ├── withdrawals
    ├── featured
    └── settings
```

## Shared Libraries
- `packages/ui`: components (buttons, inputs, cards, tabs, toasts, modals, charts wrappers).
- `packages/theme`: Tailwind preset + tokens.
- `packages/api-types`: Zod schemas, TypeScript types for DTOs (generated from Prisma via `prisma-zod-generator`).
- `packages/utils`: cross-cutting utilities (date formatting, currency, analytics, sockets).

## State Management Patterns
- React Query for async server data with caching, optimistic updates (e.g., bidding).
- Zustand store for UI state (modals, notifications panel, filters).
- Socket.IO hooks to subscribe to real-time channels.

## Video Meeting Integration
- Placeholder for integration with third-party video SDK (Daily.co / Twilio Live).
- Backend to issue meeting tokens, frontend to embed SDK in meeting page.

## Dev & Deployment Workflow
1. **Local**: `npm run dev` concurrently starts Vite frontend and Express backend with hot reload.
2. **Database**: Postgres via Docker Compose (`docker-compose.db.yml`).
3. **Migrations**: `npm run prisma:migrate` with documented workflow.
4. **Testing**: `npm run test` (unit) / `npm run lint` / `npm run typecheck`.
5. **CI**: GitHub Actions (planned) to run lint, test, build, upload coverage.
6. **Deployment**: Docker images built per app, deployed to container platform (Render/Fly). DB managed (Supabase/Aiven).

## Security Considerations
- Input validation via Zod on both client and server.
- Password hashing with Argon2.
- Rate limiting (express-rate-limit) on auth and bidding endpoints.
- CORS restricted to known origins, HTTPS enforced.
- Audit logs for admin actions.

## Next Steps
1. Scaffold npm workspaces, TypeScript base config, linting.
2. Implement Prisma schema covering users, creators, events, bids, payments, notifications, meetings.
3. Build Express API with modular routing and auth.
4. Create React app with Tailwind theme reflecting design system.
5. Develop shared UI components and route skeletons.
6. Integrate real data flows incrementally (bids, payments, notifications).
