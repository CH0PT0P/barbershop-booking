'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DatePage() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDays, setAvailableDays] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    // Get weekly schedule
    const { data: weekly } = await supabase
      .from('availability')
      .select('*')

    // Get date overrides
    const { data: overrides } = await supabase
      .from('date_overrides')
      .select('*')

    // Which days of week are open
    const openDays = new Set()
    if (weekly) {
      weekly.forEach(day => {
        if (!day.is_blocked) openDays.add(day.day_of_week)
      })
    }
    setAvailableDays(openDays)

    // Which specific dates are blocked or opened via override
    const blocked = new Set()
    const opened = new Set()
    if (overrides) {
      overrides.forEach(o => {
        if (o.is_blocked) blocked.add(o.date)
        else opened.add(o.date)
      })
    }
    setBlockedDates({ blocked, opened })
    setLoading(false)
  }

  function isDateAvailable(date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayOfWeek = date.getDay()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Can't book in the past
    if (date <= today) return false

    // Can't book more than 6 months out
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 180)
    if (date > maxDate) return false

    // Override: specifically blocked
    if (blockedDates.blocked?.has(dateStr)) return false

    // Override: specifically opened (overrides closed day)
    if (blockedDates.opened?.has(dateStr)) return true

    // Fall back to weekly schedule
    return availableDays.has(dayOfWeek)
  }

  function selectDate(date) {
    localStorage.setItem('selectedDate', date.toISOString())
    setSelected(date.toISOString())
  }

  function prevMonth() {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    setCurrentMonth(d)
  }

  function nextMonth() {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    setCurrentMonth(d)
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Pick a Date</h1>
      <p className="text-gray-400 text-center mb-10">Select an available day</p>

      {loading ? (
        <p className="text-gray-400 text-center">Loading availability...</p>
      ) : (
        <>
          <div className="max-w-md mx-auto bg-zinc-900 rounded-2xl p-6 mb-6">

            {/* Month navigation */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="text-gray-400 hover:text-white text-xl px-2">‹</button>
              <span className="font-semibold text-lg">{monthNames[month]} {year}</span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-white text-xl px-2">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(year, month, i + 1)
                const available = isDateAvailable(date)
                const isSelected = selected === date.toISOString()

                return (
                  <button
                    key={i}
                    onClick={() => available && selectDate(date)}
                    disabled={!available}
                    className={`rounded-lg py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'bg-white text-black'
                        : available
                        ? 'hover:bg-zinc-700 text-white'
                        : 'text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={() => router.push('/book/time')}
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