'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const service = JSON.parse(localStorage.getItem('selectedService'))
    const date = localStorage.getItem('selectedDate')
    const time = localStorage.getItem('selectedTime')
    const name = localStorage.getItem('clientName')
    const phone = localStorage.getItem('clientPhone')

    if (!service || !date || !time || !name || !phone) {
      router.push('/book')
      return
    }

    setBooking({ service, date: new Date(date), time, name, phone })
  }, [])

  function formatTime(time) {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  async function confirmBooking() {
    setLoading(true)
    setError('')

    try {
      const dateStr = booking.date.toISOString().split('T')[0]
      const phoneDigits = booking.phone.replace(/\D/g, '')

      // Check if client exists, if not create them
      let clientId
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', phoneDigits)
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ name: booking.name, phone: phoneDigits })
          .select('id')
          .single()
        if (clientError) throw clientError
        clientId = newClient.id
      }

      // Create the appointment
      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          date: dateStr,
          time: booking.time + ':00',
          service: booking.service.name,
          status: 'booked'
        })
      if (apptError) throw apptError

// Send confirmation text
      const dateStr2 = booking.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: booking.name,
          phone: booking.phone.replace(/\D/g, ''),
          service: booking.service.name,
          date: dateStr2,
          time: formatTime(booking.time)
        })
      })

      // Clear localStorage
      localStorage.removeItem('selectedService')
      localStorage.removeItem('selectedDate')
      localStorage.removeItem('selectedTime')
      localStorage.removeItem('clientName')
      localStorage.removeItem('clientPhone')

      setConfirmed(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    }

    setLoading(false)
  }

  if (!booking) return null

  if (confirmed) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-3 text-center">You're booked!</h1>
        <p className="text-gray-400 text-center mb-8">See you soon, {booking.name.split(' ')[0]}.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition"
        >
          Back to Home
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Confirm Booking</h1>
      <p className="text-gray-400 text-center mb-10">Review your appointment details</p>

      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Service</span>
            <span className="font-semibold">{booking.service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date</span>
            <span className="font-semibold">
              {booking.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Time</span>
            <span className="font-semibold">{formatTime(booking.time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price</span>
            <span className="font-semibold">${booking.service.price}</span>
          </div>
          <div className="border-t border-zinc-700 pt-4 flex justify-between">
            <span className="text-gray-400">Name</span>
            <span className="font-semibold">{booking.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phone</span>
            <span className="font-semibold">{booking.phone}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <div className="max-w-md mx-auto">
        <button
          onClick={confirmBooking}
          disabled={loading}
          className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </main>
  )
}