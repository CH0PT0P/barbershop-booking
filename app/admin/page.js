'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')

  useEffect(() => {
    checkAuth()
    fetchAppointments()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin')
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (name, phone)
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) console.error(error)
    else setAppointments(data)
    setLoading(false)
  }

  async function cancelAppointment(id, clientName) {
    const confirmed = window.confirm(`Cancel ${clientName}'s appointment? This will send them a cancellation text.`)
    if (!confirmed) return

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (!error) fetchAppointments()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  function formatTime(time) {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  const today = new Date().toISOString().split('T')[0]

  const todayAppts = appointments.filter(a =>
    a.date === today && a.status === 'booked'
  )

  const upcomingAppts = appointments.filter(a =>
    a.date > today && a.status === 'booked'
  )

  const filteredAppts = activeTab === 'today' ? todayAppts : upcomingAppts

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dev The Barber</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Log Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Today</p>
            <p className="text-3xl font-bold">{todayAppts.length}</p>
            <p className="text-gray-400 text-sm">appointments</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold">{upcomingAppts.length}</p>
            <p className="text-gray-400 text-sm">appointments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'today'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-gray-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'upcoming'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-gray-400 hover:text-white'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Appointments */}
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : filteredAppts.length === 0 ? (
          <p className="text-gray-400">No appointments {activeTab === 'today' ? 'today' : 'upcoming'}.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAppts.map((appt) => (
              <div
                key={appt.id}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{appt.clients?.name}</p>
                    <p className="text-gray-400 text-sm">{appt.service}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })} at {formatTime(appt.time)}
                    </p>
                    <p className="text-gray-400 text-sm">{appt.clients?.phone}</p>
                  </div>
                  <button
                    onClick={() => cancelAppointment(appt.id, appt.clients?.name)}
                    className="text-red-400 hover:text-red-300 text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}