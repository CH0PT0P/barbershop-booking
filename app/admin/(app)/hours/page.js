'use client'

// Hours — manage Dev's weekly schedule and one-off date overrides.
//
// Weekly tab:  7 day rows with open/close Toggle + time inputs.
// Overrides tab: add / delete one-time date changes.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { todayString, formatLongDate } from '../../../lib/time'
import ScreenHeader from '../../components/layout/ScreenHeader'
import SegmentedControl from '../../components/primitives/SegmentedControl'
import Toggle from '../../components/primitives/Toggle'
import Icon from '../../components/layout/Icon'
import PrimaryButton from '../../components/primitives/PrimaryButton'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function HoursPage() {
  const [tab, setTab]                 = useState('Overrides')
  const [availability, setAvailability] = useState([])
  const [overrides, setOverrides]     = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: avail }, { data: ovr }] = await Promise.all([
      supabase.from('availability').select('*').order('day_of_week', { ascending: true }),
      supabase.from('date_overrides').select('*').order('date', { ascending: true }),
    ])
    setAvailability(avail || [])
    setOverrides(ovr || [])
    setLoading(false)
  }

  async function toggleDay(id, currentlyBlocked) {
    await supabase.from('availability').update({ is_blocked: !currentlyBlocked }).eq('id', id)
    setAvailability(prev =>
      prev.map(d => d.id === id ? { ...d, is_blocked: !currentlyBlocked } : d)
    )
  }

  async function updateTime(id, field, value) {
    await supabase.from('availability').update({ [field]: value }).eq('id', id)
    setAvailability(prev =>
      prev.map(d => d.id === id ? { ...d, [field]: value } : d)
    )
  }

  async function deleteOverride(id) {
    await supabase.from('date_overrides').delete().eq('id', id)
    setOverrides(prev => prev.filter(o => o.id !== id))
  }

  async function saveOverride(date, isBlocked, start, end) {
    await supabase.from('date_overrides').upsert({
      date,
      is_blocked: isBlocked,
      start_time: isBlocked ? null : start,
      end_time:   isBlocked ? null : end,
    })
    fetchAll()
  }

  return (
    <div className="overflow-y-auto" style={{ height: '100dvh' }}>
      <ScreenHeader eyebrow="MANAGE" title="Hours" />

      {/* Tab switcher */}
      <div className="px-4 mb-5">
        <SegmentedControl
          options={['Weekly', 'Overrides']}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div
        className="px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
      >
        {loading ? (
          <p className="text-muted text-center py-8">Loading…</p>
        ) : tab === 'Weekly' ? (
          <WeeklyTab
            availability={availability}
            onToggle={toggleDay}
            onUpdateTime={updateTime}
          />
        ) : (
          <OverridesTab
            overrides={overrides}
            onSave={saveOverride}
            onDelete={deleteOverride}
          />
        )}
      </div>
    </div>
  )
}

// ─── Weekly tab ───────────────────────────────────────────────────────────────

function WeeklyTab({ availability, onToggle, onUpdateTime }) {
  return (
    <div className="flex flex-col gap-3">
      {availability.map(day => (
        <DayRow
          key={day.id}
          day={day}
          onToggle={() => onToggle(day.id, day.is_blocked)}
          onUpdateTime={(field, val) => onUpdateTime(day.id, field, val)}
        />
      ))}
    </div>
  )
}

function DayRow({ day, onToggle, onUpdateTime }) {
  const open = !day.is_blocked

  return (
    <div
      className="
        bg-white rounded-[16px] overflow-hidden
        border-hairline border-[color:var(--color-hairline)]
        shadow-card
      "
    >
      {/* Day name + toggle */}
      <div className="flex items-center justify-between px-4 py-[14px]">
        <div>
          <div className="text-[16px] font-semibold text-body">
            {DAYS[day.day_of_week]}
          </div>
          <div className="text-[12px] text-muted tnum mt-[1px]">
            {open
              ? `${fmt(day.start_time)} – ${fmt(day.end_time)}`
              : 'Closed'
            }
          </div>
        </div>
        <Toggle on={open} onChange={onToggle} />
      </div>

      {/* Time inputs — visible only when open */}
      {open && (
        <div
          className="px-4 pb-[14px] pt-[12px] flex gap-3"
          style={{ borderTop: '0.5px solid var(--color-divider)' }}
        >
          <TimeInput
            label="Opens"
            defaultValue={day.start_time?.slice(0, 5) || '09:00'}
            onCommit={val => onUpdateTime('start_time', val)}
          />
          <TimeInput
            label="Closes"
            defaultValue={day.end_time?.slice(0, 5) || '17:00'}
            onCommit={val => onUpdateTime('end_time', val)}
          />
        </div>
      )}
    </div>
  )
}

// Uncontrolled time input — saves on blur so we don't hammer Supabase while typing.
function TimeInput({ label, defaultValue, onCommit }) {
  return (
    <div className="flex-1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-[6px]">
        {label}
      </div>
      <input
        type="time"
        defaultValue={defaultValue}
        onBlur={e => onCommit(e.target.value)}
        className="
          w-full px-3 py-[10px]
          bg-eggshell-soft rounded-[12px]
          text-[14px] font-semibold tnum text-body
          border-hairline border-[color:var(--color-hairline)]
          focus:outline-none
        "
      />
    </div>
  )
}

// ─── Overrides tab ────────────────────────────────────────────────────────────

function OverridesTab({ overrides, onSave, onDelete }) {
  const [date, setDate]           = useState('')
  const [blocked, setBlocked]     = useState(false)
  const [start, setStart]         = useState('09:00')
  const [end, setEnd]             = useState('17:00')
  const [saving, setSaving]       = useState(false)

  async function handleSave() {
    if (!date) return
    setSaving(true)
    await onSave(date, blocked, start, end)
    setDate('')
    setBlocked(false)
    setStart('09:00')
    setEnd('17:00')
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Add override form ── */}
      <div
        className="
          bg-white rounded-[16px] overflow-hidden
          border-hairline border-[color:var(--color-hairline)]
          shadow-card p-4
        "
      >
        <div className="text-[13px] font-semibold text-body mb-3">
          Add a one-time change
        </div>

        {/* Date picker */}
        <div className="relative mb-3">
          <div
            className="
              flex items-center justify-between
              px-4 py-[13px] rounded-[14px]
              bg-eggshell-soft
              border-hairline border-[color:var(--color-hairline)]
            "
          >
            <div className="flex items-center gap-2">
              <Icon name="calendar" size={15} className="text-muted" />
              <span className={`text-[15px] font-semibold ${date ? 'text-body' : 'text-muted'}`}>
                {date ? formatLongDate(date) : 'Pick a date'}
              </span>
            </div>
            <Icon name="chevronDown" size={14} className="text-muted" />
          </div>
          <input
            type="date"
            value={date}
            min={todayString()}
            onChange={e => setDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </div>

        {/* Block toggle */}
        <div className="flex items-center justify-between py-[10px]">
          <div>
            <div className="text-[14px] font-semibold text-body">Block this day off</div>
            <div className="text-[12px] text-muted">No appointments accepted</div>
          </div>
          <Toggle on={blocked} onChange={setBlocked} />
        </div>

        {/* Custom hours — only when not fully blocked */}
        {!blocked && (
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-[6px]">
                Opens
              </div>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="
                  w-full px-3 py-[10px]
                  bg-eggshell-soft rounded-[12px]
                  text-[14px] font-semibold tnum text-body
                  border-hairline border-[color:var(--color-hairline)]
                  focus:outline-none
                "
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-[6px]">
                Closes
              </div>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="
                  w-full px-3 py-[10px]
                  bg-eggshell-soft rounded-[12px]
                  text-[14px] font-semibold tnum text-body
                  border-hairline border-[color:var(--color-hairline)]
                  focus:outline-none
                "
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <PrimaryButton fullWidth disabled={!date || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save change'}
          </PrimaryButton>
        </div>
      </div>

      {/* ── Existing overrides list ── */}
      {overrides.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-3">
            Scheduled changes
          </div>
          <div className="flex flex-col gap-[6px]">
            {overrides.map(o => (
              <div
                key={o.id}
                className="
                  flex items-center gap-3
                  bg-white rounded-[12px] px-4 py-[10px]
                  border-hairline border-[color:var(--color-hairline)]
                  shadow-card
                "
              >
                <div className="text-[13px] font-semibold text-body flex-1">
                  {formatLongDate(o.date)}
                </div>
                <div className="text-[12px] text-muted tnum">
                  {o.is_blocked ? 'Closed' : `${fmt(o.start_time)} – ${fmt(o.end_time)}`}
                </div>
                <button
                  onClick={() => onDelete(o.id)}
                  className="text-muted active:text-danger transition-colors pl-1"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {overrides.length === 0 && (
        <p className="text-muted text-[14px] text-center py-4">
          No scheduled changes.
        </p>
      )}
    </div>
  )
}

// Format "09:00:00" or "09:00" → "9:00 AM"
function fmt(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`
}
