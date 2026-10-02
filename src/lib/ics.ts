import dayjs from 'dayjs'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIcsDate(date: Date, time: string) {
  const d = dayjs(date)
  const [h, m] = String(time || '00:00').split(':').map(Number)
  return d.hour(h || 0).minute(m || 0).second(0).format('YYYYMMDDTHHmmss')
}

function escapeIcs(text: unknown) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function buildIcs({ appointment, client, provider, service }: any) {
  const dtStart = toIcsDate(appointment.date, appointment.startTime)
  const dtEnd = toIcsDate(appointment.date, appointment.endTime)
  const uid = `${appointment._id}@appointly`
  const now = dayjs().format('YYYYMMDDTHHmmss')
  const summary = `${service?.title || 'Appointment'} with ${provider?.name || 'provider'}`
  const description = [
    `Status: ${appointment.status}`,
    client?.email ? `Client: ${client.email}` : '',
    appointment.notes ? `Notes: ${appointment.notes}` : '',
  ]
    .filter(Boolean)
    .join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appointly//Appointment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `ORGANIZER;CN=${escapeIcs(provider?.name || 'Provider')}:MAILTO:${provider?.email || 'noreply@appointly.local'}`,
    client?.email ? `ATTENDEE;CN=${escapeIcs(client.name || 'Client')}:MAILTO:${client.email}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Appointment reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}
