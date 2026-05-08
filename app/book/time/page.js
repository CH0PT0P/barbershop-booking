'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TimePage() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    const date = localStorage.getItem('selectedDate')
    if (!date) { router.push('/book'); return }
    setSelectedDate(new Date(date))
    fetchBookedSlots(new Date(date))
  }, [])

  async function fetchBookedSlots(date) {
    const dateStr = date.toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', dateStr)
      .eq('status', 'booked')
    if (data) setBookedSlots(data.map(a => a.time))
  }

  function generateTimeSlots() {
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  function formatTime(time) {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  function selectTime(slot) {
    localStorage.setItem('selectedTime', slot)
    setSelected(slot)
  }

  const slots = generateTimeSlots()

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Pick a Time</h1>
      {selectedDate && (
        <p className="text-gray-400 text-center mb-10">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      )}

      <div className="max-w-md mx-auto grid grid-cols-3 gap-3 mb-8">
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot + ':00')
          const isSelected = selected === slot
          return (
            <button
              key={slot}
              onClick={() => !isBooked && selectTime(slot)}
              disabled={isBooked}
              className={`rounded-xl py-3 text-sm font-medium transition border ${
                isSelected
                  ? 'bg-white text-black border-white'
                  : isBooked
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700 hover:border-white'
              }`}
            >
              {isBooked ? '—' : formatTime(slot)}
            </button>
          )
        })}
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/book/info')}
          disabled={!selected}
          className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg disabled:opacity-30 hover:bg-gray-200 transition"
        >
          Continue
        </button>
      </div>
    </main>
  )
}