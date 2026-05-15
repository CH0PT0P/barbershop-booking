'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function formatSlot(h, m) {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh = ((h + 11) % 12) + 1
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`
}

function formatLong(d) {
  if (!d) return ''
  const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
  return `${dow}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

const SERVICE_COLORS = {
  mens: '#D9663A',
  kids: '#D9A53A',
  beard: '#7A9457',
  mullet: '#A6536F',
}

function ScissorsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="13" cy="34" r="6" stroke="#1F1A14" strokeWidth="2.5"/>
      <circle cx="35" cy="34" r="6" stroke="#1F1A14" strokeWidth="2.5"/>
      <path d="M17.5 30 L40 8" stroke="#1F1A14" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M30.5 30 L8 8" stroke="#1F1A14" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function KidIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M12 26 C12 17, 18 11, 24 11 C30 11, 36 17, 36 26 V32 C36 36, 32 40, 24 40 C16 40, 12 36, 12 32 Z" stroke="#1F1A14" strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx="19" cy="25" r="1.5" fill="#1F1A14"/>
      <circle cx="29" cy="25" r="1.5" fill="#1F1A14"/>
      <path d="M20 31 Q24 34, 28 31" stroke="#1F1A14" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function BeardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M14 22 C14 14, 18 9, 24 9 C30 9, 34 14, 34 22" stroke="#1F1A14" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 22 C12 30, 16 40, 24 41 C32 40, 36 30, 34 22" stroke="#1F1A14" strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
  )
}

function MulletIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M30 14 C26 9, 18 10, 16 18 L15 26 L13 28 L15 30 L16 33 C17 36, 19 38, 22 38" stroke="#1F1A14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 16 C36 18, 38 24, 36 30 C34 36, 30 41, 26 42" stroke="#1F1A14" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

const SERVICE_ICONS = { mens: ScissorsIcon, kids: KidIcon, beard: BeardIcon, mullet: MulletIcon }

export default function TimePage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const services = JSON.parse(localStorage.getItem('selectedServices') || '[]')
    const date = localStorage.getItem('selectedDate')
    if (!services.length || !date) { router.push('/book'); return }
    setBookings(services)
    const dateObj = new Date(date)
    setSelectedDate(dateObj)
    buildSlots(dateObj, services)
  }, [])

  async function buildSlots(date, services) {
    setLoading(true)
    const totalDuration = services.reduce((s, b) => s + b.duration, 0)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    const dayOfWeek = date.getDay()

    const { data: override } = await supabase
      .from('date_overrides').select('*').eq('date', dateStr).single()
    const { data: weekly } = await supabase
      .from('availability').select('*').eq('day_of_week', dayOfWeek).single()

    let startTime, endTime, isBlocked
    if (override) {
      isBlocked = override.is_blocked
      startTime = override.start_time
      endTime = override.end_time
    } else if (weekly) {
      isBlocked = weekly.is_blocked
      startTime = weekly.start_time
      endTime = weekly.end_time
    }

    if (isBlocked || !startTime || !endTime) {
      setSlots([])
      setLoading(false)
      return
    }

    const { data: booked } = await supabase
      .from('appointments').select('time, service')
      .eq('date', dateStr).eq('status', 'booked')

    const blockedMinutes = new Set()
    if (booked) {
      booked.forEach(appt => {
        const [h, m] = appt.time.split(':').map(Number)
        const start = h * 60 + m
        const dur = getServiceDuration(appt.service)
        for (let i = start; i < start + dur; i++) blockedMinutes.add(i)
      })
    }

    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMin = startH * 60 + startM
    const endMin = endH * 60 + endM
    const BASE = 40

    const generated = []
    for (let min = startMin; min + totalDuration <= endMin; min += BASE) {
      let conflict = false
      for (let i = min; i < min + totalDuration; i++) {
        if (blockedMinutes.has(i)) { conflict = true; break }
      }
      generated.push({
        key: `${Math.floor(min/60)}:${min%60}`,
        hour: Math.floor(min/60),
        min: min % 60,
        minutes: min,
        available: !conflict,
      })
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

  function handleContinue() {
    if (!selectedSlot) return
    const timeStr = `${String(selectedSlot.hour).padStart(2,'0')}:${String(selectedSlot.min).padStart(2,'0')}`
    localStorage.setItem('selectedTime', timeStr)
    router.push('/book/info')
  }

  const morning = slots.filter(s => s.hour < 12)
  const afternoon = slots.filter(s => s.hour >= 12)

  // Schedule strip — chained appointments
  const totalDuration = bookings.reduce((s, b) => s + b.duration, 0)
  const endMinutes = selectedSlot ? selectedSlot.minutes + totalDuration : null
  const endHour = endMinutes ? Math.floor(endMinutes / 60) : null
  const endMin = endMinutes ? endMinutes % 60 : null

  // Chip colors
  const chipColors = bookings.slice(0,4).map(b => {
    const colorMap = { terra: PAL.terra, mustard: PAL.mustard, sage: PAL.sage, plum: PAL.plum }
    return colorMap[b.color] || PAL.terra
  })

  return (
    <main style={{
      position: 'fixed', inset: 0,
      backgroundColor: PAL.bg,
      fontFamily: '-apple-system, system-ui, sans-serif',
      color: PAL.ink, overflow: 'hidden',
    }}>
      {/* Paper grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(31,26,20,0.06) 1px, transparent 1px)',
        backgroundSize: '4px 4px', opacity: 0.55, mixBlendMode: 'multiply', zIndex: 0,
      }}/>

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%', overflowY: 'auto',
        paddingBottom: 140,
      }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '54px 14px 8px',
          background: PAL.bg,
        }}>
          <button
            onClick={() => router.push('/book/date')}
            style={{
              border: 0, background: PAL.paper, cursor: 'pointer',
              width: 40, height: 40, borderRadius: 999,
              boxShadow: '0 2px 8px rgba(31,26,20,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M11 18l-7-6 7-6" stroke={PAL.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {bookings.length > 0 && (
            <div style={{
              flex: 1, minWidth: 0,
              border: '1px solid rgba(31,26,20,0.10)',
              background: PAL.paper, borderRadius: 999,
              padding: '6px 14px 6px 10px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(31,26,20,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {chipColors.map((color, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: color, marginLeft: i === 0 ? 0 : -8,
                    border: `2px solid ${PAL.paper}`, zIndex: 10 - i,
                  }}/>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: PAL.ink3,
                  letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1, marginBottom: 2,
                }}>Booking</div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: PAL.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {bookings.length} {bookings.length === 1 ? 'service' : 'services'} · {totalDuration} min · ${bookings.reduce((s,b) => s+b.price, 0)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ padding: '16px 22px 12px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.6,
            color: PAL.ink3, textTransform: 'uppercase',
          }}>Step 3 of 3</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 38, lineHeight: 1.1, letterSpacing: -1.0,
            margin: '6px 0 8px', color: PAL.ink, fontWeight: 400,
          }}>Choose a time</h1>
          <div style={{ fontSize: 14, color: PAL.ink2 }}>
            {selectedDate ? formatLong(selectedDate) : ''}
          </div>
        </div>

        <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Schedule strip */}
          {selectedSlot && (
            <div style={{
              background: PAL.card, borderRadius: 16,
              border: '0.5px solid rgba(31,26,20,0.08)',
              padding: '12px 14px 14px',
              boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset',
            }}>
              <div style={{
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'space-between', gap: 12, marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: PAL.ink3,
                  letterSpacing: 1.2, textTransform: 'uppercase',
                }}>Your appointment</div>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  fontSize: 16, color: PAL.ink, letterSpacing: -0.2,
                }}>
                  {formatSlot(selectedSlot.hour, selectedSlot.min)}
                  <span style={{ opacity: 0.4 }}> → </span>
                  {formatSlot(endHour, endMin)}
                </div>
              </div>

              {/* Proportional color blocks */}
              <div style={{
                display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden',
                border: '0.5px solid rgba(31,26,20,0.08)',
              }}>
                {bookings.map((b, i) => {
                  const Icon = SERVICE_ICONS[b.id] || ScissorsIcon
                  const colorMap = { terra: PAL.terra, mustard: PAL.mustard, sage: PAL.sage, plum: PAL.plum }
                  const color = colorMap[b.color] || PAL.terra
                  return (
                    <div key={b.uid || i} style={{
                      flex: b.duration,
                      background: color + 'C0',
                      borderRight: i < bookings.length - 1 ? '0.5px solid rgba(31,26,20,0.18)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 0,
                    }}>
                      <Icon size={16}/>
                    </div>
                  )
                })}
              </div>

              <div style={{
                fontSize: 11, color: PAL.ink3, marginTop: 8, padding: '0 2px',
              }}>
                {bookings.length} {bookings.length === 1 ? 'service' : 'services'} · {totalDuration} min · back-to-back
              </div>
            </div>
          )}

          {/* Morning slots */}
          {loading ? (
            <div style={{ textAlign: 'center', color: PAL.ink3, fontSize: 14 }}>Loading...</div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: PAL.ink3, fontSize: 14, marginBottom: 16 }}>No availability on this day.</div>
              <button
                onClick={() => router.push('/book/date')}
                style={{
                  border: 0, background: PAL.ink, color: PAL.paper,
                  fontWeight: 600, fontSize: 14, padding: '12px 24px',
                  borderRadius: 999, cursor: 'pointer',
                }}>Pick Another Date</button>
            </div>
          ) : (
            <>
              {morning.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 4px 10px',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
                      color: PAL.ink3, textTransform: 'uppercase',
                    }}>Morning</div>
                    <div style={{ flex: 1, height: 1, background: 'rgba(31,26,20,0.10)' }}/>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {morning.map(slot => (
                      <button
                        key={slot.key}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        disabled={!slot.available}
                        style={{
                          border: selectedSlot?.key === slot.key ? 'none' : `1px solid rgba(31,26,20,${!slot.available ? 0.10 : 0.14})`,
                          background: selectedSlot?.key === slot.key ? PAL.ink : (!slot.available ? 'transparent' : PAL.card),
                          color: selectedSlot?.key === slot.key ? PAL.paper : PAL.ink,
                          borderRadius: 14, height: 48,
                          fontWeight: selectedSlot?.key === slot.key ? 600 : 500,
                          fontSize: 14, letterSpacing: -0.1,
                          cursor: slot.available ? 'pointer' : 'default',
                          opacity: !slot.available ? 0.35 : 1,
                          textDecoration: !slot.available ? 'line-through' : 'none',
                          boxShadow: selectedSlot?.key === slot.key ? '0 6px 16px rgba(31,26,20,0.26)' : (!slot.available ? 'none' : '0 1px 0 rgba(255,255,255,0.5) inset'),
                          transition: 'background .15s ease, color .15s ease',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {formatSlot(slot.hour, slot.min)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {afternoon.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 4px 10px',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
                      color: PAL.ink3, textTransform: 'uppercase',
                    }}>Afternoon</div>
                    <div style={{ flex: 1, height: 1, background: 'rgba(31,26,20,0.10)' }}/>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {afternoon.map(slot => (
                      <button
                        key={slot.key}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        disabled={!slot.available}
                        style={{
                          border: selectedSlot?.key === slot.key ? 'none' : `1px solid rgba(31,26,20,${!slot.available ? 0.10 : 0.14})`,
                          background: selectedSlot?.key === slot.key ? PAL.ink : (!slot.available ? 'transparent' : PAL.card),
                          color: selectedSlot?.key === slot.key ? PAL.paper : PAL.ink,
                          borderRadius: 14, height: 48,
                          fontWeight: selectedSlot?.key === slot.key ? 600 : 500,
                          fontSize: 14, letterSpacing: -0.1,
                          cursor: slot.available ? 'pointer' : 'default',
                          opacity: !slot.available ? 0.35 : 1,
                          textDecoration: !slot.available ? 'line-through' : 'none',
                          boxShadow: selectedSlot?.key === slot.key ? '0 6px 16px rgba(31,26,20,0.26)' : (!slot.available ? 'none' : '0 1px 0 rgba(255,255,255,0.5) inset'),
                          transition: 'background .15s ease, color .15s ease',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {formatSlot(slot.hour, slot.min)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                fontSize: 12, color: PAL.ink3, textAlign: 'center', marginTop: 2,
              }}>Faded times are unavailable.</div>
            </>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25,
        background: PAL.paper,
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 24px rgba(31,26,20,0.12)',
        borderTop: '0.5px solid rgba(31,26,20,0.10)',
        padding: '14px 18px 40px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: PAL.ink3,
            letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1,
          }}>{selectedSlot ? 'Starts at' : 'No time selected'}</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 20, color: PAL.ink, lineHeight: 1.15,
            letterSpacing: -0.3, marginTop: 4,
          }}>{selectedSlot ? formatSlot(selectedSlot.hour, selectedSlot.min) : '—'}</div>
        </div>
        <button
          disabled={!selectedSlot}
          onClick={handleContinue}
          style={{
            border: 0, cursor: selectedSlot ? 'pointer' : 'default',
            background: selectedSlot ? PAL.ink : 'rgba(31,26,20,0.12)',
            color: selectedSlot ? PAL.paper : PAL.ink3,
            fontWeight: 600, fontSize: 15,
            padding: '14px 22px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedSlot ? '0 6px 14px rgba(31,26,20,0.22)' : 'none',
            flexShrink: 0,
          }}
        >
          Confirm
          {selectedSlot && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </main>
  )
}