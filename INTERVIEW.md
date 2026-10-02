# Tempo — Appointment Management System

**Interview Assignment Documentation**  
Full-stack appointment platform built for a **Round 2 interview assignment**.

---

## 1. Assignment Brief (Problem Statement)

Build an appointment management system where:

- Admins manage users, services, and availability
- Providers manage their schedule and appointments
- Clients browse services, pick slots, and book visits
- System prevents double-bookings
- Dashboard shows useful booking insights
- Production-ready: auth, validation, email, deployable

**My approach:** Ship a complete MVP with clean architecture, role-based access, live slot logic, and a distinctive UI — not a demo mock.

---

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16** (App Router, Turbopack) | Full-stack in one codebase — UI + API routes |
| Language | **TypeScript** | Safer refactors, better DX |
| Database | **MongoDB Atlas** + **Mongoose 9** | Flexible schema for appointments/availability |
| Styling | **Tailwind CSS v4** | Fast, token-based design system |
| Auth | **JWT + httpOnly cookies** + bcryptjs | Secure, no token in localStorage |
| Validation | **Zod** | Runtime schema validation on every API |
| Charts | **Recharts** | Dashboard trends & status mix |
| Email | **Nodemailer** | Booking + password reset mails |
| Calendar export | **ICS** (custom generator) | Google/Apple calendar import |
| UI polish | framer-motion, lucide-react, react-hot-toast | Micro-interactions, icons, toasts |

---

## 3. Architecture Overview

```
Browser (React Client Components)
        │  fetch + credentials: 'include'
        ▼
Next.js Route Handlers  (src/app/api/**)
        │  Zod → requireAuth → role check
        ▼
Service layer logic  (src/lib/slots.ts, auth.ts, mailer.ts, ics.ts)
        │
        ▼
Mongoose Models  (src/lib/models.ts)
        │
        ▼
MongoDB Atlas  (cluster0.svp5ayw.mongodb.net / appointments)
```

**Key principles:**
1. **Client never talks to DB directly** — all writes go through API
2. **Server is source of truth** for slots, auth, and roles
3. **Scoped data** — clients see own bookings; providers see their patients; admins see all
4. **UI state is derived from API** — no hardcoded business data

---

## 4. Domain Model (Database Design)

### User
| Field | Type | Notes |
|-------|------|-------|
| name, email, phone | string | email unique + lowercase |
| password | string | bcrypt hash, `select: false` |
| role | enum | `admin` \| `provider` \| `client` |
| isActive | boolean | soft disable |
| resetToken / resetTokenExpires | string / date | password reset |

### Service
| Field | Type | Notes |
|-------|------|-------|
| title, description, category | string | bookable catalog item |
| durationMin, price | number | drives slot length |
| provider | ObjectId → User | who offers the service |
| isActive | boolean | soft delete for providers |

### Availability
| Field | Type | Notes |
|-------|------|-------|
| provider | ObjectId (unique) | one doc per provider |
| weekly[] | day, start, end, enabled | Mon–Sun template |
| breaks[] | start, end | excluded from slots |
| daysOff[] | Date[] | specific holidays |
| slotDurationMin | number | default 30 |

### Appointment
| Field | Type | Notes |
|-------|------|-------|
| client, provider, service | ObjectId | three-way relation |
| date, startTime, endTime | Date / string | booking window |
| status | enum | pending → confirmed → completed / cancelled / no_show |
| notes, cancelReason | string | context |
| reminderSent | boolean | cron-ready |

**Critical index (double-booking guard):**

```js
appointmentSchema.index(
  { provider: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] },
    },
  }
)
```

Same provider + date + time can exist only once among **active** bookings — DB-level safety net.

---

## 5. Features Implemented

### Auth & Roles
- Register / login / logout
- JWT signed with `JWT_SECRET`, stored in **httpOnly cookie** (XSS-resistant)
- Password reset via hashed one-time token (30 min expiry)
- Role middleware: admin / provider / client gates

### Booking Flow (Client)
1. Pick service (duration + price visible)
2. Pick provider
3. Pick date → **live slots** from availability − breaks − busy appointments
4. Confirm → status `pending`
5. Download ICS, cancel/reschedule when allowed

### Provider / Admin Ops
- Create/edit/deactivate services
- Set weekly hours, breaks, days off
- Confirm / complete / mark no-show
- Reschedule appointments
- Admin: user list, role change, activate/deactivate, delete

### Dashboard
- Total bookings, today’s count
- Providers/services (admin) or revenue/completed (client/provider)
- 30-day bookings trend (area chart)
- Status mix (donut)

### UX
- Distinctive **Tempo** design system (editorial palette, Space Grotesk)
- Dark/light mode
- Mobile bottom nav + desktop sidebar
- Skeletons, empty states, toasts
- Calendar month/week views + “No visits” empty labels
- Search, filters, pagination on lists

---

## 6. API Surface

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password/:token

Users
  GET    /api/users?role=&search=&page=     (admin)
  PATCH  /api/users/:id                     (admin)
  DELETE /api/users/:id                     (admin)
  PATCH  /api/users/me

Services
  GET    /api/services
  POST   /api/services                      (admin, provider)
  PATCH  /api/services/:id
  DELETE /api/services/:id

Availability
  GET    /api/availability/:providerId
  GET    /api/availability/:providerId/slots?date=&serviceId=
  PUT    /api/availability

Appointments
  POST   /api/appointments
  GET    /api/appointments?status=&from=&to=&search=&page=
  GET    /api/appointments/:id
  GET    /api/appointments/:id?format=ics
  PATCH  /api/appointments/:id?mode=status
  PATCH  /api/appointments/:id?mode=reschedule
  DELETE /api/appointments/:id

Stats
  GET    /api/stats/overview
```

**Auth pattern on every protected route:**
```ts
const { user, error } = await requireAuth(request)
if (error) return error
// role check + scoped filter by user.role
```

---

## 7. Slot Engine (Core Business Logic)

**File:** `src/lib/slots.ts`

```
Available slots =
  weekly hours for that weekday
  − breaks
  − daysOff
  − existing pending/confirmed appointments
  − slots shorter than service duration
```

Steps:
1. Load availability (create default Mon–Fri 09–17 if missing)
2. Validate target date is enabled
3. Generate candidate slots by duration
4. Subtract break windows
5. Subtract busy ranges from DB appointments
6. Return `{ startTime, endTime }[]`

**Why server-side:** Client-side slots are untrustworthy; only server knows real bookings.

---

## 8. Security Decisions

| Concern | Decision |
|---------|----------|
| Password storage | bcrypt (cost 10), never stored plain |
| Token transport | httpOnly cookie — JS cannot read → XSS hard to steal |
| Cookie flags | `secure` + `sameSite` in production |
| Validation | Zod on every mutating endpoint |
| Auth errors | 401 for unauthenticated, 403 for wrong role |
| Password reset | SHA-256 hashed token + expiry; email enumeration avoided (“if email exists…”) |
| Secrets | `.env*` gitignored; Vercel env vars for production |
| Unique index | Prevents race double-bookings at DB level |

---

## 9. Engineering Challenges Faced & Fixes

### 1) Mongoose 9 async middleware — “next is not a function”
**Symptom:** Register / forgot-password returned 500.  
**Cause:** Mongoose 7+ async `pre('save')` hooks do **not** receive callback `next`.  
**Fix:**
```ts
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10))
})
```

### 2) Calendar page infinite blink
**Symptom:** Calendar flickered constantly.  
**Cause:** `useEffect` deps used dayjs **objects** (`cursor.startOf('month')`) — new identity every render → effect loop.  
**Fix:** Depend on formatted **strings** (`fromStr`, `toStr`), ignore stale responses with `reqIdRef`, keep previous data while refetching.

### 3) Input icons overlapping text
**Symptom:** Leading icons sat on top of input text.  
**Cause:** Custom `.input` padding lived outside `@layer components`, so Tailwind `pl-10` lost the cascade.  
**Fix:** Move `.input` into `@layer components` + dedicated `.input-icon { padding-left: 2.75rem }`.

### 4) Chart titles touching card edges
**Cause:** Cards had no default padding.  
**Fix:** `.panel` padding in components layer; tables override with `p-0`.

### 5) Hydration warning from browser extension
**Cause:** Extension injected `cz-shortcut-listen` on `<body>`.  
**Fix:** `suppressHydrationWarning` on body (not an app logic bug).

### 6) Route handler params in Next 16
**Cause:** `params` is async.  
**Fix:** `const { token } = await context.params` / `Promise<{ id: string }>`.

### 7) Dynamic segment conflicts
**Symptom:** `/api/users/[id]` swallowed list route.  
**Fix:** Split GET list (`/api/users/route.ts`) from PATCH/DELETE (`/api/users/[id]/route.ts`).

---

## 10. Project Structure

```
appointment-system/
├── scripts/seed.mjs          # Atlas demo seed
├── src/
│   ├── app/
│   │   ├── api/              # REST route handlers
│   │   ├── (app)/            # Authenticated pages (dashboard, book, calendar…)
│   │   ├── login/ register/  # Public auth pages
│   │   ├── forgot-password/ reset-password/
│   │   ├── layout.tsx providers.tsx globals.css
│   ├── components/           # AppShell, Card, Modal, Badge, PageHeader…
│   ├── context/              # AuthContext, ThemeContext
│   └── lib/                  # db, models, auth, slots, mailer, ics, api
├── .env.example .env.production
├── vercel.json
└── package.json
```

---

## 11. How to Run

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI + JWT_SECRET
npm run seed                 # demo data → Atlas
npm run dev                  # http://localhost:3000
```

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Admin@123 |
| Provider | ava@demo.com | Provider@123 |
| Client | client1@demo.com | Client@123 |

### Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed Atlas (drops + recreates demo data) |
| `npm run lint` | ESLint |

---

## 12. Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set env vars:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<long-random>
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app
```

4. Deploy → update `NEXT_PUBLIC_APP_URL` after domain is assigned
5. Optional: configure `SMTP_HOST/USER/PASS` for emails

**Prod notes:**
- Cookies become `secure` + `sameSite: none` under HTTPS
- Use a **different** JWT secret than local dev
- Atlas network access should allow Vercel (or use 0.0.0.0/0 carefully)

---

## 13. Testing Done (Smoke / E2E via API)

Verified against live dev server + Atlas:

| Area | Result |
|------|--------|
| Build | ✅ `next build` — 27 routes |
| Pages | ✅ All main routes HTTP 200 |
| Auth | ✅ Login admin/provider/client; wrong password 401; validation 400 |
| Register | ✅ Client signup works (after Mongoose hook fix) |
| Services CRUD | ✅ Create/list |
| Availability | ✅ Save weekly hours |
| Slots | ✅ Weekday slots generated (e.g. 13 slots) |
| Booking E2E | ✅ Create pending → confirm → ICS download → complete → cancel |
| Password reset request | ✅ 200 + mail skipped without SMTP |
| Auth guard | ✅ Unauthenticated stats → 401 |

---

## 14. What I Would Improve Next

1. **Tests** — Vitest/Playwright for slot engine + API contracts  
2. **Rate limiting** on auth endpoints  
3. **Real-time** updates (pusher/socket) when provider confirms  
4. **Reminder cron** (node-cron already in deps) for 24h SMS/email  
5. **Payments** — Stripe deposit before confirm  
6. **File uploads** for avatars  
7. **i18n** + accessibility audit  
8. **Observability** — structured logs, Sentry  
9. **Multi-tenant** clinics (org id on all resources)  
10. Clean remaining ESLint `no-explicit-any` / effect setState warnings  

---

## 15. Interview Talking Points (Quick Script)

> “I built **Tempo**, a full-stack appointment studio on **Next.js 16 + MongoDB Atlas**.  
> Clients book services against provider availability; slots are generated server-side from weekly hours, breaks, and existing bookings.  
> **Double-booking is blocked twice**: application check + a unique partial index on active appointments.  
> Auth is **JWT in httpOnly cookies** with bcrypt passwords and role-scoped APIs (admin/provider/client).  
> Dashboard uses aggregation pipelines for 30-day trends.  
> I hit real issues during the build — Mongoose 9 async hooks, a calendar effect loop from dayjs object deps, and Tailwind cascade overriding input padding — and fixed each at the root.  
> The app is seeded on Atlas, build-clean, and deploy-ready on Vercel.”

---

## 16. File Map (Deep Dive)

| Path | Responsibility |
|------|----------------|
| `src/lib/db.ts` | Cached Mongoose connection |
| `src/lib/models.ts` | User, Service, Availability, Appointment schemas + indexes |
| `src/lib/auth.ts` | JWT sign/verify, cookies, requireAuth/requireRole |
| `src/lib/slots.ts` | Availability + slot generation |
| `src/lib/mailer.ts` | Nodemailer wrappers (skip if SMTP empty) |
| `src/lib/ics.ts` | ICS calendar file builder |
| `src/lib/api.ts` | Client fetch wrapper with credentials |
| `src/context/AuthContext.tsx` | Session bootstrap, login/register/logout |
| `src/components/AppShell.tsx` | Sidebar + mobile nav by role |
| `src/app/api/**/route.ts` | HTTP handlers + validation + authorization |
| `scripts/seed.mjs` | Demo users/services/availability/appointments |

---

*Document prepared for interview discussion of the appointment management assignment.*
