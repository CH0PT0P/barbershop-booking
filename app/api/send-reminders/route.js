import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  // Verify this is being called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Get all booked appointments with client info
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`*, clients (name, phone)`)
      .eq('status', 'booked')

    if (error) throw error

    const reminders24 = []
    const reminders2 = []

    appointments.forEach(appt => {
      const apptTime = new Date(`${appt.date}T${appt.time}`)
      const hoursUntil = (apptTime - now) / (1000 * 60 * 60)

      if (hoursUntil >= 23.5 && hoursUntil <= 24.5) reminders24.push(appt)
      if (hoursUntil >= 1.75 && hoursUntil <= 2.25) reminders2.push(appt)
    })

    const results = []

    for (const appt of [...reminders24, ...reminders2]) {
      const is24 = reminders24.includes(appt)
      const name = appt.clients?.name?.split(' ')[0]
      const phone = appt.clients?.phone

      if (!phone) continue

      const apptTime = new Date(`${appt.date}T${appt.time}`)
      const timeStr = apptTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const dateStr = apptTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

      const message = is24
        ? `Hey ${name}! Just a reminder you have a ${appt.service} tomorrow at ${timeStr}. Reply CANCEL to cancel. — Dev The Barber`
        : `Hey ${name}! Your ${appt.service} is in 2 hours at ${timeStr} on ${dateStr}. Reply CANCEL to cancel. — Dev The Barber`

      try {
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+1${phone}`
        })
        results.push({ name, status: 'sent', type: is24 ? '24hr' : '2hr' })
      } catch (err) {
        results.push({ name, status: 'failed', error: err.message })
      }
    }

    return Response.json({
      success: true,
      sent: results.length,
      results
    })

  } catch (err) {
    console.error('Reminder error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}