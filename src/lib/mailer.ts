import nodemailer from 'nodemailer'
import dayjs from 'dayjs'

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const tx = getTransporter()
  if (!tx) {
    console.log(`[mailer] Skipped (no SMTP) -> ${to}: ${subject}`)
    return { skipped: true }
  }
  try {
    const info = await tx.sendMail({ from: process.env.SMTP_USER, to, subject, html })
    return { messageId: info.messageId }
  } catch (err: any) {
    console.error('[mailer] Failed:', err.message)
    return { error: err.message }
  }
}

function formatDateTime(date: Date | string, startTime: string) {
  return `${dayjs(date).toDate().toDateString()} at ${startTime}`
}

export async function sendBookingEmails({
  appointment,
  client,
  provider,
  service,
}: any) {
  await Promise.all([
    sendMail({
      to: client.email,
      subject: 'Appointment Request Received',
      html: `<h2>Hi ${client.name},</h2><p>Your appointment request has been received.</p>
        <ul><li><strong>Service:</strong> ${service?.title || 'Service'}</li>
        <li><strong>Provider:</strong> ${provider?.name || 'N/A'}</li>
        <li><strong>When:</strong> ${formatDateTime(appointment.date, appointment.startTime)} – ${appointment.endTime}</li></ul>`,
    }),
    sendMail({
      to: provider.email,
      subject: 'New Appointment Request',
      html: `<h2>Hi ${provider.name},</h2><p>New appointment request from ${client.name}.</p>
        <ul><li><strong>Service:</strong> ${service?.title || 'Service'}</li>
        <li><strong>When:</strong> ${formatDateTime(appointment.date, appointment.startTime)} – ${appointment.endTime}</li></ul>`,
    }),
  ])
}

export async function sendStatusEmail({ appointment, client, provider, service, statusLabel }: any) {
  await sendMail({
    to: client.email,
    subject: `Appointment ${statusLabel}`,
    html: `<h2>Hi ${client.name},</h2><p>Your appointment is now <strong>${statusLabel}</strong>.</p>
      <ul><li><strong>Service:</strong> ${service?.title || 'Service'}</li>
      <li><strong>Provider:</strong> ${provider?.name || 'N/A'}</li>
      <li><strong>When:</strong> ${formatDateTime(appointment.date, appointment.startTime)} – ${appointment.endTime}</li>
      ${appointment.cancelReason ? `<li><strong>Reason:</strong> ${appointment.cancelReason}</li>` : ''}</ul>`,
  })
}

export async function sendReminderEmail({ appointment, client, provider, service }: any) {
  await sendMail({
    to: client.email,
    subject: 'Appointment Reminder',
    html: `<h2>Hi ${client.name},</h2><p>Reminder: your appointment is tomorrow.</p>
      <ul><li><strong>Service:</strong> ${service?.title || 'Service'}</li>
      <li><strong>Provider:</strong> ${provider?.name || 'N/A'}</li>
      <li><strong>When:</strong> ${formatDateTime(appointment.date, appointment.startTime)} – ${appointment.endTime}</li></ul>`,
  })
}

export async function sendPasswordResetEmail({ to, resetUrl, name }: any) {
  return sendMail({
    to,
    subject: 'Reset Your Password',
    html: `<h2>Hi ${name || 'there'},</h2><p>Click to reset your password (expires in 30 minutes).</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>`,
  })
}
