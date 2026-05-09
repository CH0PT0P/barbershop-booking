'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TimePage() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [serviceDuration, setServiceDuration] = useState(40)

  useEffect(() => {
    const date = localStorage.getItem('selectedDate')
    const service = JSON.parse(localStorage.getItem('selectedService'))
    if (!date || !service) { router.push('/book'); return }
    const dateObj = new Date(date)
    setSelectedDate(dateObj)
    setServiceDuration(service.duration)
    buildSlots(dateObj, service.duration)
  }, [])

  async function buildSlots(date, duration) {
    setLoading(true)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()

    // Check for date override first
    const { data: override } = await supabase
      .from('date_overrides')
      .select('*')
      .eq('date', dateStr)
      .single()

    // Fall back to weekly availability
    const { data: weeklyAvail } = await supabase
      .from('availability')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single()

    // Figure out which hours to use
    let startTime, endTime, isBlocked

    if (override) {
      isBlocked = override.is_blocked
      startTime = override.start_time
      endTime = override.end_time
    } else if (weeklyAvail) {
      isBlocked = weeklyAvail.is_blocked
      startTime = weeklyAvail.start_time
      endTime = weeklyAvail.end_time
    }

    if (isBlocked || !startTime || !endTime) {
      setSlots([])
      setLoading(false)
      return
    }

    // Get booked appointments for this date
    const { data: booked } = await supabase
      .from('appointments')
      .select('time, service')
      .eq('date', dateStr)
      .eq('status', 'booked')

    // Build blocked minutes from existing appointments
    const blockedMinutes = new Set()
    if (booked) {
      booked.forEach(appt => {
        const [h, m] = appt.time.split(':').map(Number)
        const apptStart = h * 60 + m
        const apptDuration = getServiceDuration(appt.service)
        for (let i = apptStart; i < apptStart + apptDuration; i++) {
          blockedMinutes.add(i)
        }
      })
    }

    // Always step in 40 min increments (base grid)
    // But check if the selected service duration fits without conflict
    const BASE_INCREMENT = 40
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    const generated = []
    for (let min = startMinutes; min + duration <= endMinutes; min += BASE_INCREMENT) {
      // Check if the service duration fits cleanly from this slot
      let conflict = false
      for (let i = min; i < min + duration; i++) {
        if (blockedMinutes.has(i)) { conflict = true; break }
      }
      const hour = Math.floor(min / 60)
      const minute = min % 60
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      generated.push({ time: timeStr, available: !conflict })
    }

    setSlots(generated)
    setLoading(false)
  }

  function getServiceDuration(service) {
    if (service === "Men's Cut") return 40
    if (service === 'Kids Cut') return 30
    if (service === 'Beard Trim') return 15
    if (service === 'Mullet Trim') return 15
    return 40
  }

  function formatTime(time) {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  function selectTime(slot) {
    localStorage.setItem('selectedTime', slot)
    setSelected(slot)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Pick a Time</h1>
      {selectedDate && (
        <p className="text-gray-400 text-center mb-10">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-center">Loading available times...</p>
      ) : slots.length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-gray-400 mb-6">No availability on this day.</p>
          <button
            onClick={() => router.push('/book/date')}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
          >
            Pick Another Date
          </button>
        </div>
      ) : (
        <>
          <div className="max-w-md mx-auto grid grid-cols-3 gap-3 mb-8">
            {slots.map(({ time, available }) => {
              const isSelected = selected === time
              return (
                <button
                  key={time}
                  onClick={() => available && selectTime(time)}
                  disabled={!available}
                  className={`rounded-xl py-3 text-sm font-medium transition border ${
                    isSelected
                      ? 'bg-white text-black border-white'
                      : !available
                      ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                      : 'border-zinc-700 hover:border-white'
                  }`}
                >
                  {!available ? '—' : formatTime(time)}
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
        </>
      )}
    </main>
  )
}