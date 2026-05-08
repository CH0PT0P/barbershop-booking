import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request) {
  try {
    const { name, phone, service, date, time } = await request.json()

    const message = await client.messages.create({
      body: `Hey ${name.split(' ')[0]}! Your appointment is confirmed. 📅 ${service} on ${date} at ${time}. Reply CANCEL to cancel. — Dev The Barber`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+1${phone}`
    })

    return Response.json({ success: true, sid: message.sid })
  } catch (error) {
    console.error('Twilio error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}