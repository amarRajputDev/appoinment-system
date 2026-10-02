import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import dayjs from 'dayjs'
import bcrypt from 'bcryptjs'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://akkitalksss_db_user:RJkfA61PWuJGTBSr@cluster0.svp5ayw.mongodb.net/appointments?appName=Cluster0'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB Atlas')

  const db = mongoose.connection.db
  await db.dropDatabase()

  const User = mongoose.model(
    'User',
    new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, enum: ['admin', 'provider', 'client'], default: 'client' },
        phone: { type: String, default: '' },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  )

  const Service = mongoose.model(
    'Service',
    new mongoose.Schema(
      {
        title: String,
        description: { type: String, default: '' },
        durationMin: Number,
        price: Number,
        category: { type: String, default: 'General' },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  )

  const Availability = mongoose.model(
    'Availability',
    new mongoose.Schema(
      {
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
        weekly: [
          {
            day: Number,
            start: String,
            end: String,
            enabled: Boolean,
          },
        ],
        breaks: [{ start: String, end: String }],
        daysOff: [Date],
        slotDurationMin: { type: Number, default: 30 },
      },
      { timestamps: true }
    )
  )

  const Appointment = mongoose.model(
    'Appointment',
    new mongoose.Schema(
      {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        date: Date,
        startTime: String,
        endTime: String,
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
          default: 'pending',
        },
        notes: { type: String, default: '' },
        cancelReason: { type: String, default: '' },
        reminderSent: { type: Boolean, default: false },
      },
      {
        timestamps: true,
        autoIndex: true,
      }
    ).index(
      { provider: 1, date: 1, startTime: 1 },
      { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
    )
  )

  const hash = async (p) => bcrypt.hash(p, 10)

  const admin = await User.create({
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: await hash('Admin@123'),
    role: 'admin',
    phone: '+10000000001',
  })

  const providers = await User.create([
    { name: 'Dr. Ava Chen', email: 'ava@demo.com', password: await hash('Provider@123'), role: 'provider', phone: '+10000000002' },
    { name: 'Marco Silva', email: 'marco@demo.com', password: await hash('Provider@123'), role: 'provider', phone: '+10000000003' },
    { name: 'Priya Nair', email: 'priya@demo.com', password: await hash('Provider@123'), role: 'provider', phone: '+10000000004' },
  ])

  const clients = []
  for (let i = 1; i <= 10; i++) {
    clients.push(
      await User.create({
        name: `Client ${String(i).padStart(2, '0')}`,
        email: `client${i}@demo.com`,
        password: await hash('Client@123'),
        role: 'client',
        phone: `+100000000${10 + i}`,
      })
    )
  }

  const services = await Service.create([
    { title: 'General Consultation', durationMin: 30, price: 80, category: 'Medical', provider: providers[0]._id },
    { title: 'Follow-up Visit', durationMin: 20, price: 50, category: 'Medical', provider: providers[0]._id },
    { title: 'Haircut & Style', durationMin: 45, price: 65, category: 'Beauty', provider: providers[1]._id },
    { title: 'Hair Coloring', durationMin: 90, price: 140, category: 'Beauty', provider: providers[1]._id },
    { title: 'Business Consulting', durationMin: 60, price: 200, category: 'Consulting', provider: providers[2]._id },
    { title: 'Career Coaching', durationMin: 45, price: 120, category: 'Consulting', provider: providers[2]._id },
    { title: 'Dental Checkup', durationMin: 30, price: 90, category: 'Medical', provider: providers[0]._id },
    { title: 'Massage Therapy', durationMin: 60, price: 110, category: 'Wellness', provider: providers[1]._id },
  ])

  for (const p of providers) {
    await Availability.create({
      provider: p._id,
      weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        start: '09:00',
        end: '17:00',
        enabled: day !== 0 && day !== 6,
      })),
      breaks: [{ start: '12:00', end: '13:00' }],
      daysOff: [],
      slotDurationMin: 30,
    })
  }

  const statuses = ['confirmed', 'confirmed', 'completed', 'pending', 'cancelled']
  const appointments = []
  for (let i = 0; i < 60; i++) {
    const service = services[i % services.length]
    const client = clients[i % clients.length]
    const dayOffset = (i % 20) - 8
    const date = dayjs().add(dayOffset, 'day').startOf('day')
    const hour = 9 + (i % 7)
    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endMin = hour * 60 + service.durationMin
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
    const status =
      dayOffset < 0
        ? i % 5 === 3
          ? 'cancelled'
          : i % 11 === 4
          ? 'no_show'
          : 'completed'
        : statuses[i % statuses.length]

    appointments.push({
      client: client._id,
      provider: service.provider,
      service: service._id,
      date: date.toDate(),
      startTime,
      endTime,
      status,
      notes: i % 3 === 0 ? 'Follow-up requested' : '',
      cancelReason: status === 'cancelled' ? 'Client cancelled' : '',
      reminderSent: dayOffset < 0,
    })
  }

  const seen = new Set()
  const filtered = appointments.filter((a) => {
    if (a.status !== 'pending' && a.status !== 'confirmed') return true
    const key = `${a.provider}_${dayjs(a.date).format('YYYY-MM-DD')}_${a.startTime}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  await Appointment.insertMany(filtered)

  console.log('\n=== Seed complete (Next.js / Atlas) ===')
  console.log('Admin:     admin@demo.com / Admin@123')
  console.log('Providers: ava@demo.com | marco@demo.com | priya@demo.com / Provider@123')
  console.log('Clients:   client1@demo.com … client10@demo.com / Client@123')
  console.log(`Appointments: ${filtered.length}`)
  console.log('Note: SMTP emails skipped unless SMTP_USER/SMTP_PASS set.\n')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
