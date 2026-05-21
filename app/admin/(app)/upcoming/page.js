'use client'

// Upcoming — next 30 days of booked appointments, grouped by date.
// Dates with no appointments are skipped.
// Tapping a row opens the same AppointmentSheet as the day view.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  todayString,
  toDateString,
  parseDate,
  formatLongDate,
  fmtShort,
  timeStringToMinutes,
} from '../../../lib/time'
import { getServiceColor, getServiceDuration } from '../../../lib/serviceColors'
import ScreenHeader from '../../components/layout/ScreenHeader'
import Avatar from '../../components/primitives/Avatar'
import AppointmentSheet from '../../components/layout/AppointmentSheet'

export default function UpcomingPage() {
  const [groups, setGroups]         = useState([])  // [{ date, appointments[] }]
  const [loading, setLoading]       = useState(true)
  const [selectedAppt, setSelectedAppt] = useState(null)

  useEffect(() => { fetchUpcoming() }, [])

  async function fetchUpcoming() {
    setLoading(true)

    const today = todayString()
    const end   = toDateString((() => { const d = parseDate(today); d.setDate(d.getDate() + 30); return d })())

    const { data } = await supabase
      .from('appointments')
      .select('id, client_id, date, time, service, status, notes, clients(name, phone)')
      .eq('status', 'booked')
      .gte('date', today)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    // Group by date
    const map = {}
    for (const appt of data || []) {
      if (!map[appt.date]) map[appt.date] = []
      map[appt.date].push(appt)
    }
    setGroups(Object.entries(map).map(([date, appointments]) => ({ date, appointments })))
    setLoading(false)
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
      fetchUpcoming()
    }
  }

  return (
    <div className="overflow-y-auto" style={{ height: '100dvh' }}>
      <ScreenHeader eyebrow="SCHEDULE" title="Upcoming" />

      <div
        className="px-4 flex flex-col gap-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
      >
        {loading ? (
          <p className="text-muted text-center py-8">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-muted text-[14px] text-center py-8">
            Nothing booked in the next 30 days.
          </p>
        ) : (
          groups.map(({ date, appointments }) => (
            <DayGroup
              key={date}
              date={date}
              appointments={appointments}
              onSelect={setSelectedAppt}
            />
          ))
        )}
      </div>

      <AppointmentSheet
        appt={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

// ─── Day group ────────────────────────────────────────────────────────────────

function DayGroup({ date, appointments, onSelect }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-2 px-1">
        {formatLongDate(date)}
      </div>
      <div
        className="
          bg-white rounded-[16px] overflow-hidden
          border-hairline border-[color:var(--color-hairline)]
          shadow-card
        "
      >
        {appointments.map((appt, i) => (
          <ApptRow
            key={appt.id}
            appt={appt}
            isLast={i === appointments.length - 1}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Appointment row ──────────────────────────────────────────────────────────

function ApptRow({ appt, isLast, onSelect }) {
  const svc      = getServiceColor(appt.service)
  const startMin = timeStringToMinutes(appt.time)
  const endMin   = startMin + getServiceDuration(appt.service)

  return (
    <button
      onClick={() => onSelect(appt)}
      className={`
        w-full flex items-center gap-3 px-4 py-[13px] text-left
        active:bg-eggshell-soft transition-colors
        ${!isLast ? 'border-b border-[color:var(--color-divider)]' : ''}
      `}
    >
      {/* Colored service bar */}
      <div className={`w-[4px] self-stretch rounded-full flex-shrink-0 ${svc.barBgClass}`} />

      <Avatar name={appt.clients?.name ?? '?'} size={34} />

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-body truncate">
          {appt.clients?.name}
        </div>
        <div className="text-[12px] text-muted mt-[1px]">
          {appt.service}
        </div>
      </div>

      <div className="text-[12px] text-muted tnum text-right flex-shrink-0">
        {fmtShort(startMin)}<br />
        <span className="text-[11px] opacity-70">{fmtShort(endMin)}</span>
      </div>
    </button>
  )
}
