'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

const PAL = {
  bg:      '#F1E8D2',
  paper:   '#FBF6E8',
  card:    '#FFFCF2',
  ink:     '#1F1A14',
  ink2:    '#5A4F3F',
  ink3:    '#8B8071',
  terra:   '#D9663A',
  mustard: '#D9A53A',
  sage:    '#7A9457',
  plum:    '#A6536F',
}

const FAM_SERIF = "var(--font-serif), 'Instrument Serif', Georgia, serif"
const FAM_UI    = "-apple-system, 'SF Pro Text', system-ui, sans-serif"

function ScissorsIcon({ size = 22, color = PAL.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="13" cy="34" r="6" stroke={color} strokeWidth="2"/>
      <circle cx="35" cy="34" r="6" stroke={color} strokeWidth="2"/>
      <path d="M17.5 30 L40 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M30.5 30 L8 8"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 23 L26 23"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function KidIcon({ size = 22, color = PAL.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M12 26 C12 17, 18 11, 24 11 C30 11, 36 17, 36 26 V32 C36 36, 32 40, 24 40 C16 40, 12 36, 12 32 Z"
            stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M24 11 C24 8, 22 6, 26 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="19" cy="25" r="1.2" fill={color}/>
      <circle cx="29" cy="25" r="1.2" fill={color}/>
      <path d="M20 31 Q24 34, 28 31" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function BeardIcon({ size = 22, color = PAL.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M14 22 C14 14, 18 9, 24 9 C30 9, 34 14, 34 22"
            stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="1.2" fill={color}/>
      <circle cx="28" cy="20" r="1.2" fill={color}/>
      <path d="M17 26 Q20 28, 24 26 Q28 28, 31 26" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 22 C12 30, 16 40, 24 41 C32 40, 36 30, 34 22"
            stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M18 32 L20 36 M22 33 L23 37 M26 33 L25 37 M30 32 L28 36"
            stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function MulletIcon({ size = 22, color = PAL.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M30 14 C26 9, 18 10, 16 18 L15 26 L13 28 L15 30 L16 33 C17 36, 19 38, 22 38"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 18 C18 14, 26 12, 32 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 16 C36 18, 38 24, 36 30 C34 36, 30 41, 26 42"
            stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="24" r="1.1" fill={color}/>
    </svg>
  )
}

const ICON_FOR  = { mens: ScissorsIcon, kids: KidIcon, beard: BeardIcon, mullet: MulletIcon }
const COLOR_FOR = { terra: PAL.terra, mustard: PAL.mustard, sage: PAL.sage, plum: PAL.plum }

function formatLongDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTimeSlot(time) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh = ((h + 11) % 12) + 1
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

const ghostButton = {
  border: '1px solid rgba(31,26,20,0.18)',
  background: PAL.card,
  color: PAL.ink,
  fontFamily: FAM_UI,
  fontWeight: 600,
  fontSize: 13,
  padding: '12px 14px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  letterSpacing: -0.1,
  boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset',
  flex: 1,
}

export default function ConfirmPage() {
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [status, setStatus] = useState('loading') // loading | submitting | done | error
  const [error, setError] = useState('')

  useEffect(() => {
    const servicesRaw = localStorage.getItem('selectedServices')
    const dateRaw     = localStorage.getItem('selectedDate')
    const time        = localStorage.getItem('selectedTime')
    const name        = localStorage.getItem('clientName')
    const phone       = localStorage.getItem('clientPhone')

    if (!servicesRaw || !dateRaw || !time || !name || !phone) {
      router.push('/book')
      return
    }

    const services = JSON.parse(servicesRaw)
    const date     = new Date(dateRaw)
    const data     = { services, date, time, name, phone }

    setBooking(data)
    submitBooking(data)
  }, [])

  async function submitBooking({ services, date, time, name, phone }) {
    setStatus('submitting')
    try {
      const dateStr     = date.toISOString().split('T')[0]
      const phoneDigits = phone.replace(/\D/g, '')

      let clientId
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', phoneDigits)
        .single()

      if (existing) {
        clientId = existing.id
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ name, phone: phoneDigits })
          .select('id')
          .single()
        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      for (const svc of services) {
        const { error: apptErr } = await supabase
          .from('appointments')
          .insert({
            client_id: clientId,
            date: dateStr,
            time: time + ':00',
            service: svc.name,
            status: 'booked',
            notes: null,
          })
        if (apptErr) throw apptErr
      }

      const dateStr2 = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phoneDigits,
          service: services.map(s => s.name).join(', '),
          date: dateStr2,
          time: formatTimeSlot(time),
        }),
      })

      localStorage.removeItem('selectedServices')
      localStorage.removeItem('selectedService')
      localStorage.removeItem('selectedDate')
      localStorage.removeItem('selectedTime')
      localStorage.removeItem('clientName')
      localStorage.removeItem('clientPhone')

      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const confNum = useMemo(() => {
    if (!booking) return ''
    const [h, m] = booking.time.split(':').map(Number)
    const seed = (h * 100 + m) + booking.services.length * 7 + (booking.date.getDate() || 0)
    return `DB-${String(seed % 9999).padStart(4, '0')}`
  }, [booking])

  if (!booking || status === 'loading' || status === 'submitting') {
    return (
      <main style={{
        minHeight: '100dvh', background: PAL.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FAM_UI,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center', color: PAL.ink3 }}>
          <div style={{
            width: 36, height: 36,
            border: `3px solid rgba(31,26,20,0.15)`,
            borderTopColor: PAL.ink,
            borderRadius: '50%',
            margin: '0 auto 14px',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <div style={{ fontSize: 14 }}>Confirming your booking…</div>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main style={{
        minHeight: '100dvh', background: PAL.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 16,
        fontFamily: FAM_UI, color: PAL.ink, textAlign: 'center',
      }}>
        <div style={{ fontSize: 15, color: PAL.terra }}>{error}</div>
        <button
          onClick={() => router.push('/book/info')}
          style={{
            border: 0, background: PAL.ink, color: PAL.paper,
            fontFamily: FAM_UI, fontWeight: 600, fontSize: 15,
            padding: '14px 28px', borderRadius: 999, cursor: 'pointer',
          }}>
          Go back
        </button>
      </main>
    )
  }

  const total    = booking.services.reduce((s, b) => s + b.price, 0)
  const totalMin = booking.services.reduce((s, b) => s + b.duration, 0)
  const dow      = formatLongDate(booking.date).split(',')[0].toLowerCase()
  const firstName = booking.name.trim().split(' ')[0]

  return (
    <main style={{
      minHeight: '100dvh', background: PAL.bg,
      fontFamily: FAM_UI, color: PAL.ink,
      overflowY: 'auto', paddingBottom: 48,
    }}>
      {/* paper grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(31,26,20,0.06) 1px, transparent 1px)',
        backgroundSize: '4px 4px', opacity: 0.55, mixBlendMode: 'multiply', zIndex: 0,
      }}/>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: '52px 22px 16px' }}>
          <div style={{
            fontFamily: FAM_UI, fontSize: 11, fontWeight: 700,
            letterSpacing: 1.6, color: PAL.sage, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke={PAL.sage} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            You're booked
          </div>
          <h1 style={{
            fontFamily: FAM_SERIF, fontStyle: 'italic',
            fontSize: 44, lineHeight: 1.1, letterSpacing: -1.2,
            margin: '10px 0 0', color: PAL.ink, fontWeight: 400,
          }}>
            See you {dow}, {firstName}.
          </h1>
        </div>

        {/* Receipt card */}
        <div style={{
          margin: '0 18px',
          background: PAL.card, borderRadius: 20,
          border: '0.5px solid rgba(31,26,20,0.08)',
          boxShadow: '0 4px 12px rgba(31,26,20,0.06), 0 1px 0 rgba(255,255,255,0.6) inset',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div style={{
              fontFamily: FAM_UI, fontSize: 11, fontWeight: 700,
              letterSpacing: 1.6, color: PAL.ink3, textTransform: 'uppercase',
            }}>Dev the Barber</div>
            <div style={{ fontFamily: FAM_UI, fontSize: 11, color: PAL.ink3, letterSpacing: 0.4 }}>
              {confNum}
            </div>
          </div>

          <div style={{
            fontFamily: FAM_SERIF, fontStyle: 'italic', fontSize: 22,
            color: PAL.ink, marginTop: 6, letterSpacing: -0.4, lineHeight: 1.1,
          }}>
            {formatLongDate(booking.date)}
          </div>
          <div style={{ fontFamily: FAM_UI, fontSize: 14, color: PAL.ink2, marginTop: 2 }}>
            at {formatTimeSlot(booking.time)}
          </div>

          <div style={{ height: 1, margin: '16px -2px', borderTop: '1px dashed rgba(31,26,20,0.22)' }}/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {booking.services.map((b, i) => {
              const Icon   = ICON_FOR[b.id] || ScissorsIcon
              const accent = COLOR_FOR[b.color] || PAL.terra
              return (
                <div key={b.uid ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: accent + '2A', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} color={PAL.ink}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: FAM_SERIF, fontStyle: 'italic',
                      fontSize: 17, color: PAL.ink, lineHeight: 1.15, letterSpacing: -0.2,
                    }}>
                      {b.name}
                    </div>
                    <div style={{ fontFamily: FAM_UI, fontSize: 11, color: PAL.ink3 }}>
                      {b.duration} min
                    </div>
                  </div>
                  <div style={{
                    fontFamily: FAM_SERIF, fontStyle: 'italic',
                    fontSize: 18, color: PAL.ink,
                  }}>
                    ${b.price}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ height: 1, margin: '14px -2px', borderTop: '1px dashed rgba(31,26,20,0.22)' }}/>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: FAM_UI, fontSize: 13, color: PAL.ink3 }}>
              {totalMin} min total
            </div>
            <div style={{
              fontFamily: FAM_SERIF, fontStyle: 'italic',
              fontSize: 28, color: PAL.ink, letterSpacing: -0.4,
            }}>
              ${total}
            </div>
          </div>
        </div>

        {/* Confirmation sent to */}
        <div style={{
          margin: '14px 18px 0',
          padding: '14px 16px',
          background: PAL.paper, borderRadius: 16,
          border: '0.5px solid rgba(31,26,20,0.08)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: PAL.terra + '22', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke={PAL.ink} strokeWidth="1.8"/>
              <path d="M3 7l9 6 9-6" stroke={PAL.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FAM_UI, fontSize: 10.5, fontWeight: 700,
              letterSpacing: 1.2, color: PAL.ink3, textTransform: 'uppercase',
            }}>Confirmation sent to</div>
            <div style={{
              fontFamily: FAM_UI, fontSize: 14, color: PAL.ink, marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {booking.phone}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ margin: '14px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={ghostButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <rect x="3" y="5" width="18" height="16" rx="2" stroke={PAL.ink} strokeWidth="1.8"/>
              <path d="M3 9h18M8 3v4M16 3v4" stroke={PAL.ink} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add to calendar
          </button>
          <button style={ghostButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14"
                    stroke={PAL.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Share
          </button>
        </div>

        {/* Footer note */}
        <div style={{
          textAlign: 'center', padding: '22px 36px 6px',
          fontFamily: FAM_UI, fontSize: 13, color: PAL.ink2, lineHeight: 1.45,
        }}>
          A reminder will land the day before. Need to reschedule? Just text the shop.
        </div>

        {/* Start over */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 36px' }}>
          <button
            onClick={() => router.push('/book')}
            style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              fontFamily: FAM_UI, fontSize: 13, color: PAL.ink3,
              textDecoration: 'underline', padding: '6px 14px',
            }}>
            Start over
          </button>
        </div>

      </div>
    </main>
  )
}
