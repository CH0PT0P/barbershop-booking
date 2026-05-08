'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DatePage() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + 180)

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
  }

  function isDisabled(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const t = new Date(today)
    t.setHours(0, 0, 0, 0)
    return d <= t || d > maxDate
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
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Pick a Date</h1>
      <p className="text-gray-400 text-center mb-10">Select an available day</p>

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
            const isSelected = selected === date.toISOString()
            const disabled = isDisabled(date)
            return (
              <button
                key={i}
                onClick={() => !disabled && selectDate(date)}
                disabled={disabled}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-white text-black'
                    : disabled
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'hover:bg-zinc-700 text-white'
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
    </main>
  )
}