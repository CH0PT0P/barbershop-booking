// Day View — the home base of the admin app.
// Shows today's chair: stats, date navigation, vertical timeline of appointments.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  todayString,
  toDateString,
  parseDate,
  formatLongDate,
  thisWeekRange,
  minutesToTimeString,
} from '../../../lib/time'

import BrandHeader from '../../components/layout/BrandHeader'
import DateStrip from '../../components/layout/DateStrip'
import Timeline from '../../components/layout/Timeline'
import AppointmentSheet from '../../components/layout/AppointmentSheet'

export default function DayPage() {
  const router = useRouter()

  // Which date are we viewing? Defaults to today. Stored as "YYYY-MM-DD".
  const [viewDate, setViewDate] = useState(todayString())

  // All appointments loaded from Supabase (for the relevant date ranges).
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // Stat counts.
  const [stats, setStats] = useState({ today: 0, week: 0 })

  // Which appointment block was tapped (drives the detail sheet).
  const [selectedAppt, setSelectedAppt] = useState(null)

  // ─── Data fetching ──────────────────────────────────────────────

  // Fetch appointments for the currently-viewed date. Runs any time viewDate changes.
  useEffect(() => {
    fetchAppointmentsForDate(viewDate)
  }, [viewDate])

  // Fetch the three stat counts once on mount. They don't depend on viewDate.
  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchAppointmentsForDate(dateStr) {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, client_id, date, time, service, status, notes, clients(name, phone)')
      .eq('date', dateStr)
      .eq('status', 'booked')
      .order('time', { ascending: true })

    if (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }

  async function fetchStats() {
    const today = todayString()
    const { start: weekStart, end: weekEnd } = thisWeekRange()

    // Today's count
    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'booked')

    // This week (Mon-Sun)
    const { count: weekCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .eq('status', 'booked')

    setStats({
      today: todayCount || 0,
      week: weekCount || 0,
    })
  }

  // ─── Handlers ───────────────────────────────────────────────────

  function changeDay(deltaDays) {
    const d = parseDate(viewDate)
    d.setDate(d.getDate() + deltaDays)
    setViewDate(toDateString(d))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  function handleTapEmpty(minutes) {
    const time = minutesToTimeString(minutes)
    router.push(`/admin/new?date=${viewDate}&time=${time}`)
  }

  async function handleStatusChange(id, status) {
    const messages = {
      completed: 'Mark this appointment as complete?',
      cancelled: 'Cancel this appointment? This cannot be undone.',
    }
    if (!window.confirm(messages[status])) return

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setSelectedAppt(null)
      fetchAppointmentsForDate(viewDate)
      fetchStats()
    }
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    // flex-col + h-dvh so the timeline scroll area fills exactly the remaining
    // screen height below the header and date strip. This is necessary because
    // html/body are position:fixed (no natural page scroll).
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <BrandHeader
        todayCount={stats.today}
        weekCount={stats.week}
        onLogout={handleLogout}
      />

      <DateStrip
        label={formatLongDate(viewDate)}
        onPrev={() => changeDay(-1)}
        onNext={() => changeDay(1)}
        dateValue={viewDate}
        onDateChange={setViewDate}
      />

      {/* Scrollable timeline area — flex-1 fills whatever height remains */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-2"
        style={{
          // Extra bottom padding so the last appointment isn't hidden behind
          // the tab bar (fixed at ~90px) + safe area inset.
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)',
        }}
      >
        <Timeline
          appointments={appointments}
          loading={loading}
          onSelectAppt={setSelectedAppt}
          onTapEmpty={handleTapEmpty}
          viewDate={viewDate}
        />
      </div>

      <AppointmentSheet
        appt={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}