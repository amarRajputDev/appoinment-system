'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const features = [
  {
    icon: CalendarCheck,
    title: 'Slot intelligence',
    text: 'Working hours, breaks, and live availability — double-bookings blocked at the database level.',
  },
  {
    icon: Clock3,
    title: 'Rhythm-aware scheduling',
    text: 'Weekday templates, days off, and reminder emails keep every appointment on track.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-native access',
    text: 'Admins, providers, and clients each get a purpose-built workspace — enforced on the server.',
  },
]

const steps = [
  { n: '01', title: 'Choose a service', text: 'Browse duration, price, and category at a glance.' },
  { n: '02', title: 'Pick a professional', text: 'See who offers what, then filter by real open slots.' },
  { n: '03', title: 'Lock the moment', text: 'Confirm instantly — status, ICS, and email in one motion.' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_80%_at_15%_0%,rgba(234,88,12,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_50%_60%_at_85%_10%,rgba(15,118,110,0.12),transparent_55%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-7 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 3v3M17 3v3M4.5 9.5h15M6 6.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="13.5" r="1" fill="currentColor" />
              <circle cx="15" cy="13.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">Tempo</div>
            <div className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--muted)' }}>
              Appointment Studio
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="eyebrow mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Built for modern service businesses
          </div>
          <h1 className="font-display text-[clamp(2.6rem,7vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Scheduling that feels
            <span className="gradient-text"> intentional</span>, not automated.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
            Tempo is an appointment studio for clinics, studios, and consultants —
            refined calendars, honest availability, and a workflow your team will actually enjoy.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3.5 text-base">
              Create your studio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3.5 text-base">
              Explore the demo
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--teal)]" /> Demo ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" /> Atlas-backed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]" /> Dark & light
            </span>
          </div>
        </motion.section>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="panel panel-hover p-7"
            >
              <div className="mb-5 inline-flex rounded-xl border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-2.5 text-[color:var(--accent)]">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.text}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-16 overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[var(--shadow)]">
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <div className="p-8 sm:p-10">
              <div className="eyebrow mb-3">The flow</div>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                Three moves from open tab to confirmed visit.
              </h2>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                No cluttered forms. No mystery slots. Tempo keeps the path short and the details clear.
              </p>
            </div>
            <div className="border-t border-[color:var(--line)] p-8 sm:p-10 lg:border-l lg:border-t-0">
              <ol className="space-y-6">
                {steps.map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <div
                      className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(145deg, #ea580c, #9a3412)' }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <div className="font-semibold tracking-tight">{s.title}</div>
                      <div className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{s.text}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[1.5rem] p-8 text-center sm:p-12"
          style={{
            background: 'linear-gradient(145deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
            color: '#fafaf9',
          }}
        >
          <div className="eyebrow mb-3" style={{ color: '#fdba74' }}>Try the studio</div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in with the demo admin
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'rgba(250,250,249,0.65)' }}>
            admin@demo.com · Admin@123 — full dashboard, bookings, and team controls.
          </p>
          <Link href="/login" className="btn-primary mt-8 inline-flex px-7 py-3.5">
            Open the demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
