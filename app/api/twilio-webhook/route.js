import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const body = formData.get('Body')?.trim().toUpperCase()
    const from = formData.get('From')?.replace('+1', '').replace(/\D/g, '')

    if (!body || !from) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    if (body === 'CANCEL') {
      // Find client by phone
      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('phone', from)
        .single()

      if (!client) {
        return twimlResponse("We couldn't find your account. Please call us directly.")
      }

      // Find their next upcoming appointment
      const today = new Date().toISOString().split('T')[0]
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'booked')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)

      if (!appointments || appointments.length === 0) {
        return twimlResponse("We couldn't find any upcoming appointments for you.")
      }

      const appt = appointments[0]

      // Cancel the appointment
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appt.id)

      // Format date and time for confirmation text
      const apptDate = new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
      const [h, m] = appt.time.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour > 12 ? hour - 12 : hour
      const timeStr = `${displayHour}:${m} ${ampm}`

      // Blast waitlist
      const { data: waitlist } = await supabase
        .from('waitlist')
        .select(`*, clients (name, phone)`)

      if (waitlist && waitlist.length > 0) {
        for (const entry of waitlist) {
          const waitPhone = entry.clients?.phone
          const waitName = entry.clients?.name?.split(' ')[0]
          if (!waitPhone) continue
          try {
            await twilioClient.messages.create({
              body: `Hey ${waitName}! A slot just opened up at Dev The Barber on ${apptDate} at ${timeStr}. Book now: ${process.env.NEXT_PUBLIC_APP_URL}/book`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: `+1${waitPhone}`
            })
          } catch (err) {
            console.error('Waitlist blast error:', err)
          }
        }
      }

      return twimlResponse(`Got it ${client.name.split(' ')[0]}! Your appointment on ${apptDate} at ${timeStr} has been cancelled. We hope to see you again soon!`)
    }

    // Any other reply
    return twimlResponse("Hey! To cancel your appointment reply CANCEL. For anything else please call us directly.")

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}

function twimlResponse(message) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}