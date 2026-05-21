'use client'

// New Booking form — reached by tapping empty space on the Day View timeline,
// or by tapping the Book tab directly.
//
// When coming from the timeline, ?date and ?time are pre-filled in the URL.
// All fields are still adjustable before confirming.
//
// Flow: When → Service → Client → Confirm

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { SERVICE_COLORS, SERVICE_DURATIONS, SERVICE_PRICES } from '../../../lib/serviceColors'
import {
  todayString,
  formatLongDate,
  timeStringToMinutes,
  minutesToTimeString,
  formatPhone,
} from '../../../lib/time'
import ScreenHeader from '../../components/layout/ScreenHeader'
import PrimaryButton from '../../components/primitives/PrimaryButton'
import Avatar from '../../components/primitives/Avatar'
import Icon from '../../components/layout/Icon'
import TimeWheel from '../../components/primitives/TimeWheel'

const SERVICES = ["Men's Cut", 'Kids Cut', 'Beard Trim', 'Mullet Trim']

export default function NewBookingForm() {
  const router = useRouter()
  const params = useSearchParams()

  // Seed date + time from URL params (set when tapping the timeline).
  // Fall back to today + 11 AM if navigating directly via the Book tab.
  const initialDate = params.get('date') || todayString()
  const initialTime = params.get('time')
    ? timeStringToMinutes(params.get('time'))
    : 11 * 60

  // When coming from Reschedule, these are set so the client is pre-filled
  // and the old appointment is cancelled after the new one is saved.
  const rescheduleId     = params.get('rescheduleId')  || null
  const rescheduleClient = rescheduleId ? {
    id:    params.get('clientId')   || '',
    name:  params.get('clientName') || '',
    phone: params.get('clientPhone') || '',
  } : null

  const [date, setDate]                 = useState(initialDate)
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [service, setService]           = useState('')

  // Client search state
  const [clientSearch, setClientSearch]     = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [selectedClient, setSelectedClient] = useState(rescheduleClient)

  // New client state
  const [showNewClient, setShowNewClient] = useState(false)
  const [newName, setNewName]             = useState('')
  const [newPhone, setNewPhone]           = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  // ─── Debounced client search ───────────────────────────────────
  useEffect(() => {
    if (!clientSearch.trim() || clientSearch.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, phone')
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(6)
      setSearchResults(data || [])
    }, 250)
    return () => clearTimeout(timer)
  }, [clientSearch])

  // ─── Submit ────────────────────────────────────────────────────
  const hasClient = selectedClient || (showNewClient && newName.trim() && newPhone.trim())
  const canSubmit = !!service && !!date && selectedTime !== null && hasClient

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError('')

    let clientId

    if (selectedClient) {
      clientId = selectedClient.id
    } else {
      // Find existing by phone or create new
      const digits = newPhone.replace(/\D/g, '')
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', digits)
        .maybeSingle()

      if (existing) {
        clientId = existing.id
      } else {
        const { data: created, error: createErr } = await supabase
          .from('clients')
          .insert({ name: newName.trim(), phone: digits })
          .select('id')
          .single()
        if (createErr) {
          setError('Could not save client.')
          setSubmitting(false)
          return
        }
        clientId = created.id
      }
    }

    const { error: bookErr } = await supabase
      .from('appointments')
      .insert({
        client_id: clientId,
        date,
        time: minutesToTimeString(selectedTime) + ':00',
        service,
        status: 'booked',
      })

    if (bookErr) {
      setError('Could not create appointment.')
      setSubmitting(false)
      return
    }

    // If rescheduling, cancel the old appointment now that the new one is saved.
    if (rescheduleId) {
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', rescheduleId)
    }

    // Go back to the day view — the timeline will refresh and show the new block.
    router.push('/admin/day')
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="overflow-y-auto" style={{ height: '100dvh' }}>
      <ScreenHeader
        eyebrow={rescheduleId ? 'RESCHEDULE' : 'BOOK'}
        title={rescheduleId ? 'Pick a New Time' : 'New Appointment'}
        trailing={
          <button
            onClick={() => router.back()}
            className="text-[14px] font-medium text-muted active:opacity-60"
          >
            Cancel
          </button>
        }
      />

      <div
        className="px-4 flex flex-col gap-7"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
      >

        {/* ── When ──────────────────────────────────────────────── */}
        <section>
          <SectionLabel>When</SectionLabel>

          {/* Date — native picker hidden behind a styled display */}
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
                <Icon name="calendar" size={16} className="text-muted" />
                <span className="text-[15px] font-semibold text-body">
                  {date ? formatLongDate(date) : 'Pick a date'}
                </span>
              </div>
              <Icon name="chevronDown" size={15} className="text-muted" />
            </div>
            {/* Native date input sits on top, invisible, so the OS picker opens on tap */}
            <input
              type="date"
              value={date}
              min={todayString()}
              onChange={e => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>

          {/* Time wheel */}
          <div
            className="
              rounded-[16px] overflow-hidden
              border-hairline border-[color:var(--color-hairline)]
              bg-eggshell-soft
            "
          >
            <TimeWheel value={selectedTime} onChange={setSelectedTime} />
          </div>
        </section>

        {/* ── Service ───────────────────────────────────────────── */}
        <section>
          <SectionLabel>Service</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(svc => {
              const colors     = SERVICE_COLORS[svc]
              const isSelected = service === svc
              return (
                <button
                  key={svc}
                  onClick={() => setService(svc)}
                  className={`
                    p-4 rounded-[14px] text-left
                    border-2 transition-colors
                    ${isSelected
                      ? `${colors.bgClass} ${colors.barClass}`
                      : 'bg-eggshell-soft border-transparent active:bg-eggshell'
                    }
                  `}
                >
                  <div className={`text-[15px] font-bold leading-tight ${isSelected ? colors.textClass : 'text-body'}`}>
                    {svc}
                  </div>
                  <div className={`text-[12px] mt-1 ${isSelected ? colors.textClass : 'text-muted'}`}>
                    {SERVICE_DURATIONS[svc]} min · ${SERVICE_PRICES[svc]}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Client ────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Client</SectionLabel>

          {/* Selected client badge */}
          {selectedClient ? (
            <div
              className="
                flex items-center justify-between
                px-4 py-3 rounded-[14px]
                bg-eggshell
                border-hairline border-[color:var(--color-hairline)]
              "
            >
              <div className="flex items-center gap-3">
                <Avatar name={selectedClient.name} size={32} />
                <div>
                  <div className="text-[14px] font-bold text-body">{selectedClient.name}</div>
                  <div className="text-[12px] text-muted">{formatPhone(selectedClient.phone)}</div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedClient(null); setClientSearch('') }}
                className="text-muted active:opacity-60"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="search" size={16} className="text-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or phone…"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="
                    w-full pl-9 pr-4 py-[13px]
                    bg-eggshell-soft rounded-[14px]
                    text-[15px] text-body placeholder:text-muted
                    border-hairline border-[color:var(--color-hairline)]
                    focus:outline-none
                  "
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div
                  className="
                    mt-2 rounded-[14px] overflow-hidden
                    border-hairline border-[color:var(--color-hairline)]
                    bg-white
                  "
                >
                  {searchResults.map((client, i) => (
                    <button
                      key={client.id}
                      onClick={() => { setSelectedClient(client); setClientSearch(''); setSearchResults([]) }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        active:bg-eggshell-soft transition-colors
                        ${i < searchResults.length - 1 ? 'border-b border-[color:var(--color-divider)]' : ''}
                      `}
                    >
                      <Avatar name={client.name} size={32} />
                      <div>
                        <div className="text-[14px] font-semibold text-body">{client.name}</div>
                        <div className="text-[12px] text-muted">{formatPhone(client.phone)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* New client toggle */}
              <button
                onClick={() => setShowNewClient(v => !v)}
                className="
                  mt-3 flex items-center gap-[6px]
                  text-[14px] font-semibold text-sepia
                  active:opacity-60
                "
              >
                <Icon name={showNewClient ? 'chevronDown' : 'plus'} size={15} />
                New client
              </button>

              {showNewClient && (
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="
                      w-full px-4 py-[13px]
                      bg-eggshell-soft rounded-[14px]
                      text-[15px] text-body placeholder:text-muted
                      border-hairline border-[color:var(--color-hairline)]
                      focus:outline-none
                    "
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="
                      w-full px-4 py-[13px]
                      bg-eggshell-soft rounded-[14px]
                      text-[15px] text-body placeholder:text-muted
                      border-hairline border-[color:var(--color-hairline)]
                      focus:outline-none
                    "
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Error + Confirm ───────────────────────────────────── */}
        {error && (
          <p className="text-danger text-[14px] text-center -mt-2">{error}</p>
        )}

        <PrimaryButton
          fullWidth
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? (rescheduleId ? 'Rescheduling…' : 'Booking…')
            : (rescheduleId ? 'Confirm Reschedule' : 'Confirm Booking')
          }
        </PrimaryButton>

      </div>
    </div>
  )
}

// Section eyebrow label — matches the ScreenHeader eyebrow style
function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-sepia mb-3">
      {children}
    </div>
  )
}

