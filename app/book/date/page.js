'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'

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
const DAYS = ['S','M','T','W','T','F','S']
const DAY_LABELS = ['sun','mon','tue','wed','thu','fri','sat']

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function sameDate(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatLong(d) {
  if (!d) return ''
  const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
  return `${dow}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function DatePage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(null)
  const [bookings, setBookings] = useState([])
  const [availability, setAvailability] = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  today.setHours(0,0,0,0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    const services = JSON.parse(localStorage.getItem('selectedServices') || '[]')
    if (!services.length) { router.push('/book'); return }
    setBookings(services)
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    const [{ data: avail }, { data: ovr }] = await Promise.all([
      supabase.from('availability').select('*'),
      supabase.from('date_overrides').select('*'),
    ])
    if (avail) setAvailability(avail)
    if (ovr) setOverrides(ovr)
    setLoading(false)
  }

  function isAvailable(date) {
    if (!date) return false
    const d = new Date(date)
    d.setHours(0,0,0,0)
    if (d <= today) return false
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 180)
    if (d > maxDate) return false
    const ds = dateStr(date)
    const override = overrides.find(o => o.date === ds)
    if (override) return !override.is_blocked
    const weekly = availability.find(a => a.day_of_week === date.getDay())
    return weekly ? !weekly.is_blocked : false
  }

  const cells = useMemo(() => buildMonth(viewYear, viewMonth), [viewYear, viewMonth])

  function stepMonth(delta) {
    let m = viewMonth + delta, y = viewYear
    if (m < 0) { m = 11; y-- }
    else if (m > 11) { m = 0; y++ }
    setViewMonth(m); setViewYear(y)
  }

  function handleContinue() {
    if (!selectedDate) return
    localStorage.setItem('selectedDate', selectedDate.toISOString())
    router.push('/book/time')
  }

  // Booking chip dots
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
            onClick={() => router.push('/book')}
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

          {/* Booking chip */}
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
                  {bookings.length} {bookings.length === 1 ? 'service' : 'services'} · {bookings.reduce((s,b) => s+b.duration, 0)} min · ${bookings.reduce((s,b) => s+b.price, 0)}
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
          }}>Step 2 of 3</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 38, lineHeight: 1.1, letterSpacing: -1.0,
            margin: '6px 0 8px', color: PAL.ink, fontWeight: 400,
          }}>Choose a date</h1>
          <div style={{ fontSize: 14, color: PAL.ink2, lineHeight: 1.4 }}>
            We'll fit you all in back-to-back.
          </div>
        </div>

        {/* Calendar card */}
        <div style={{
          margin: '4px 16px 0',
          padding: '14px 14px 16px',
          background: PAL.card, borderRadius: 20,
          boxShadow: '0 4px 12px rgba(31,26,20,0.06), 0 1px 0 rgba(255,255,255,0.6) inset',
          border: '0.5px solid rgba(31,26,20,0.08)',
        }}>
          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '6px 4px 10px',
          }}>
            <button onClick={() => stepMonth(-1)} style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke={PAL.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{
              fontWeight: 600, fontSize: 16, color: PAL.ink,
              letterSpacing: -0.2,
            }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={() => stepMonth(1)} style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke={PAL.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '0 2px 6px',
          }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{
                fontSize: 10.5, fontWeight: 600, letterSpacing: 0.8,
                color: PAL.ink3, textAlign: 'center', textTransform: 'uppercase',
              }}>{d.slice(0,1)}</div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(31,26,20,0.10)', margin: '2px 2px 6px' }}/>

          {/* Days grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            rowGap: 2,
          }}>
            {cells.map((date, i) => {
              const available = isAvailable(date)
              const isSelected = sameDate(date, selectedDate)
              const isToday = date && sameDate(date, today)
              const isPast = date && date <= today

              return (
                <button
                  key={i}
                  onClick={() => available && setSelectedDate(date)}
                  disabled={!available}
                  style={{
                    position: 'relative', border: 0,
                    background: 'transparent',
                    width: '100%', aspectRatio: '1/1', padding: 0,
                    cursor: available ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 36, height: 36, borderRadius: '50%',
                      background: PAL.ink, zIndex: 1,
                    }}/>
                  )}
                  {date && (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? PAL.paper : (!available ? 'rgba(31,26,20,0.22)' : PAL.ink),
                      position: 'relative', zIndex: 2,
                    }}>{date.getDate()}</div>
                  )}
                  {isToday && !isSelected && (
                    <div style={{
                      position: 'absolute', bottom: 4, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%',
                      background: PAL.terra, zIndex: 2,
                    }}/>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 14, marginTop: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: PAL.terra }}/>
              <span style={{ fontSize: 10.5, color: PAL.ink3, letterSpacing: 0.4 }}>TODAY</span>
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(31,26,20,0.15)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10.5, color: 'rgba(31,26,20,0.32)', letterSpacing: 0.4 }}>UNAVAILABLE</span>
            </div>
          </div>
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
          }}>{selectedDate ? 'You picked' : 'No date selected'}</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 20, color: PAL.ink, lineHeight: 1.15,
            letterSpacing: -0.3, marginTop: 4,
          }}>{selectedDate ? formatLong(selectedDate) : '—'}</div>
        </div>
        <button
          disabled={!selectedDate}
          onClick={handleContinue}
          style={{
            border: 0, cursor: selectedDate ? 'pointer' : 'default',
            background: selectedDate ? PAL.ink : 'rgba(31,26,20,0.12)',
            color: selectedDate ? PAL.paper : PAL.ink3,
            fontWeight: 600, fontSize: 15,
            padding: '14px 22px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedDate ? '0 6px 14px rgba(31,26,20,0.22)' : 'none',
            flexShrink: 0,
          }}
        >
          Continue
          {selectedDate && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </main>
  )
}