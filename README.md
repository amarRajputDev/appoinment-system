# Appointment Management System (Next.js)

Full-stack appointment platform built with **Next.js App Router**, **MongoDB Atlas**, and **Tailwind CSS v4**.

## Features

- JWT auth via httpOnly cookie — roles: **admin**, **provider**, **client**
- Services CRUD, provider availability (weekly hours, breaks, days off)
- Live slot booking with double-booking prevention (unique partial index + server check)
- Reschedule / cancel / confirm / complete workflow
- Calendar month & week views, list view with filters, search, pagination
- Dashboard stats and charts (Recharts)
- Email notifications via Nodemailer (no-ops until SMTP is configured)
- ICS calendar download for appointments
- Dark/light glassmorphism UI, mobile-first layout, toasts, skeletons
- Profile management, password reset, Zod validation

## Prerequisites

- Node.js 20+
- MongoDB Atlas connection string

## Setup

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI + JWT_SECRET
npm run seed                 # demo data
npm run dev                  # http://localhost:3000
```

## Demo logins

| Role     | Email              | Password     |
|----------|--------------------|--------------|
| Admin    | admin@demo.com     | Admin@123    |
| Provider | ava@demo.com       | Provider@123 |
| Provider | marco@demo.com     | Provider@123 |
| Provider | priya@demo.com     | Provider@123 |
| Client   | client1@demo.com   | Client@123   |
| Client   | client2@demo.com … | Client@123   |

## API overview

```
POST   /api/auth/register|login|logout|forgot-password
GET    /api/auth/me
POST   /api/auth/reset-password/:token
GET    /api/users                 (admin)
PATCH  /api/users/:id             (admin)
DELETE /api/users/:id             (admin)
PATCH  /api/users/me
GET    /api/services
POST   /api/services              (admin, provider)
PATCH/DELETE /api/services/:id
GET    /api/availability/:providerId
GET    /api/availability/:providerId/slots?date=YYYY-MM-DD&serviceId=
PUT    /api/availability
POST   /api/appointments
GET    /api/appointments          ?status=&from=&to=&search=&page=
GET    /api/appointments/:id
GET    /api/appointments/:id?format=ics
PATCH  /api/appointments/:id?mode=status|reschedule
DELETE /api/appointments/:id
GET    /api/stats/overview
```

## Project structure

```
src/
├── app/
│   ├── api/          # Route handlers (auth, users, services, availability, appointments, stats)
│   ├── (app)/        # Authenticated app pages
│   ├── login/ register/ forgot-password/ reset-password/
│   ├── layout.tsx providers.tsx page.tsx globals.css
├── components/       # UI primitives + AppShell
├── context/          # AuthContext, ThemeContext
└── lib/              # db, models, auth, slots, mailer, ics, api client
scripts/seed.mjs      # Atlas seed script
```

## Production notes

- Set real `JWT_SECRET` and `MONGODB_URI`
- Configure `SMTP_*` for emails
- `npm run build && npm start`
- Same-origin cookies in production; use HTTPS
