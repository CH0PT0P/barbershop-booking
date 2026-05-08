'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function InfoPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  function handlePhone(e) {
    setPhone(formatPhone(e.target.value))
  }

  function handleContinue() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number.'); return }
    setError('')
    localStorage.setItem('clientName', name.trim())
    localStorage.setItem('clientPhone', phone)
    router.push('/book/confirm')
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Your Info</h1>
      <p className="text-gray-400 text-center mb-10">We'll send your confirmation here</p>

      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhone}
            placeholder="(555) 555-5555"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleContinue}
          className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition mt-2"
        >
          Continue
        </button>
      </div>
    </main>
  )
}