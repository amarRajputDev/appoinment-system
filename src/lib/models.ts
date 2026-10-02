import mongoose, { Schema, models, model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type Role = 'admin' | 'provider' | 'client'
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'provider', 'client'], default: 'client' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password as string)
}

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetToken
  delete obj.resetTokenExpires
  return obj
}

const serviceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMin: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'General', trim: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const availabilitySchema = new Schema(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    weekly: [
      {
        day: { type: Number, min: 0, max: 6, required: true },
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        enabled: { type: Boolean, default: true },
      },
    ],
    breaks: [{ start: String, end: String }],
    daysOff: [Date],
    slotDurationMin: { type: Number, default: 30 },
  },
  { timestamps: true }
)

const appointmentSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    cancelReason: { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

appointmentSchema.index(
  { provider: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
)

export const User = (models.User as any) || model('User', userSchema)
export const Service = (models.Service as any) || model('Service', serviceSchema)
export const Availability = (models.Availability as any) || model('Availability', availabilitySchema)
export const Appointment = (models.Appointment as any) || model('Appointment', appointmentSchema)
