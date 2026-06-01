'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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
const COLOR_FOR = { terra: PAL.terra, mustard: PAL.mustard, sage: PAL.sage, plum: PAL.plum }

function formatPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length < 4) return `(${d}`
  if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

function TextInput({ value, onChange, placeholder, type = 'text', autoComplete, inputMode, invalid }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: PAL.card,
        color: PAL.ink,
        fontFamily: FAM_UI, fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
        border: 'none', outline: 'none',
        borderRadius: 14,
        boxShadow: focused
          ? `0 0 0 2px ${invalid ? PAL.terra : PAL.ink}, 0 1px 0 rgba(255,255,255,0.5) inset`
          : `0 0 0 1px rgba(31,26,20,${invalid ? 0.3 : 0.14}), 0 1px 0 rgba(255,255,255,0.5) inset`,
        transition: 'box-shadow .15s ease',
        WebkitAppearance: 'none',
      }}
    />
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <label style={{
          fontFamily: FAM_UI, fontSize: 11, fontWeight: 700,
          letterSpacing: 1.4, color: PAL.ink3, textTransform: 'uppercase',
        }}>{label}</label>
        {hint && (
          <span style={{ fontFamily: FAM_UI, fontSize: 11, color: PAL.ink3 }}>{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <div style={{ fontFamily: FAM_UI, fontSize: 12, color: PAL.terra, marginTop: 2 }}>{error}</div>
      )}
    </div>
  )
}

function BookingChip({ bookings, onClick }) {
  if (!bookings || bookings.length === 0) return null
  const total    = bookings.reduce((s, b) => s + b.price, 0)
  const totalMin = bookings.reduce((s, b) => s + b.duration, 0)
  const dots     = bookings.slice(0, 4).map((b, i) => ({ color: COLOR_FOR[b.color] || PAL.terra, uid: b.uid ?? i }))

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0,
        border: '1px solid rgba(31,26,20,0.10)',
        background: PAL.paper, color: PAL.ink,
        borderRadius: 999, padding: '6px 14px 6px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 2px 8px rgba(31,26,20,0.08)',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: FAM_UI,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {dots.map((d, i) => (
          <div key={d.uid} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: d.color, marginLeft: i === 0 ? 0 : -8,
            border: `2px solid ${PAL.paper}`,
            zIndex: 10 - i,
          }}/>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FAM_UI, fontSize: 10, fontWeight: 700,
          color: PAL.ink3, letterSpacing: 1, textTransform: 'uppercase',
          lineHeight: 1, marginBottom: 2,
        }}>Booking</div>
        <div style={{
          fontFamily: FAM_UI, fontSize: 12, fontWeight: 600, color: PAL.ink,
          letterSpacing: -0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {bookings.length} {bookings.length === 1 ? 'service' : 'services'} · {totalMin} min · ${total}
        </div>
      </div>
    </button>
  )
}

export default function InfoPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('selectedServices')
    if (raw) setBookings(JSON.parse(raw))
  }, [])

  const nameOk  = name.trim().length >= 2
  const phoneOk = phone.replace(/\D/g, '').length === 10

  function handlePhone(v) {
    setPhone(formatPhone(v))
  }

  function handleSubmit() {
    if (!nameOk || !phoneOk) {
      setShowErrors(true)
      return
    }
    localStorage.setItem('clientName', name.trim())
    localStorage.setItem('clientPhone', phone)
    if (notes.trim()) localStorage.setItem('clientNotes', notes.trim())
    router.push('/book/confirm')
  }

  return (
    <main style={{
      position: 'fixed', inset: 0,
      background: PAL.bg,
      fontFamily: FAM_UI, color: PAL.ink,
      overflowY: 'auto',
    }}>
      {/* paper grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(31,26,20,0.06) 1px, transparent 1px)',
        backgroundSize: '4px 4px', opacity: 0.55, mixBlendMode: 'multiply', zIndex: 0,
      }}/>

      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 160 }}>

        {/* Top bar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '52px 14px 8px',
        }}>
          <button
            onClick={() => router.push('/book/time')}
            style={{
              border: 0, background: PAL.paper, cursor: 'pointer',
              width: 40, height: 40, borderRadius: 999,
              boxShadow: '0 2px 8px rgba(31,26,20,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M11 18l-7-6 7-6"
                    stroke={PAL.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <BookingChip bookings={bookings} onClick={() => router.push('/book')}/>
        </div>

        {/* Header */}
        <div style={{ padding: '120px 22px 8px' }}>
          <div style={{
            fontFamily: FAM_UI, fontSize: 11, fontWeight: 700,
            letterSpacing: 1.6, color: PAL.ink3, textTransform: 'uppercase',
          }}>Step 4 of 4</div>
          <h1 style={{
            fontFamily: FAM_SERIF, fontStyle: 'italic',
            fontSize: 38, lineHeight: 1.1, letterSpacing: -1.0,
            margin: '6px 0 12px', color: PAL.ink, fontWeight: 400,
          }}>Your details</h1>
          <div style={{ fontFamily: FAM_UI, fontSize: 14, color: PAL.ink2, lineHeight: 1.4 }}>
            We'll send a confirmation and a friendly reminder.
          </div>
        </div>

        {/* Form card */}
        <div style={{
          margin: '8px 18px 0',
          padding: '20px',
          background: PAL.paper, borderRadius: 20,
          border: '0.5px solid rgba(31,26,20,0.08)',
          boxShadow: '0 4px 12px rgba(31,26,20,0.06), 0 1px 0 rgba(255,255,255,0.6) inset',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <Field
            label="Full name"
            error={showErrors && !nameOk ? 'Tell us what to call you.' : null}
          >
            <TextInput
              value={name}
              onChange={setName}
              placeholder="Jane Doe"
              autoComplete="name"
              invalid={showErrors && !nameOk}
            />
          </Field>

          <Field
            label="Phone number"
            hint="We'll text you, not call"
            error={showErrors && !phoneOk ? 'A 10-digit number please.' : null}
          >
            <TextInput
              value={phone}
              onChange={handlePhone}
              placeholder="(555) 555-5555"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              invalid={showErrors && !phoneOk}
            />
          </Field>

          <Field label="Anything we should know?" hint="Optional">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. fade on the sides, my son has sensory issues, etc."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: PAL.card, color: PAL.ink,
                fontFamily: FAM_UI, fontSize: 14, lineHeight: 1.4,
                border: 'none', outline: 'none', resize: 'none',
                borderRadius: 14,
                boxShadow: '0 0 0 1px rgba(31,26,20,0.14), 0 1px 0 rgba(255,255,255,0.5) inset',
                WebkitAppearance: 'none',
              }}
            />
          </Field>
        </div>

        {/* Fine print */}
        <div style={{
          margin: '14px 26px 0',
          fontFamily: FAM_UI, fontSize: 11, color: PAL.ink3, lineHeight: 1.45,
        }}>
          By booking, you agree to a 24-hour cancellation window. Your info stays with the shop — no spam, no third parties.
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
        background: PAL.paper,
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 24px rgba(31,26,20,0.12)',
        borderTop: '0.5px solid rgba(31,26,20,0.10)',
        padding: '14px 18px 32px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: FAM_UI, fontSize: 10, fontWeight: 700,
            color: PAL.ink3, lineHeight: 1, letterSpacing: 1, textTransform: 'uppercase',
          }}>Almost done</div>
          <div style={{
            fontFamily: FAM_SERIF, fontStyle: 'italic',
            fontSize: 20, color: PAL.ink, lineHeight: 1.15,
            letterSpacing: -0.3, marginTop: 4,
          }}>Just one more tap.</div>
        </div>
        <button
          onClick={handleSubmit}
          style={{
            border: 0, cursor: 'pointer',
            background: PAL.ink, color: PAL.paper,
            fontFamily: FAM_UI, fontWeight: 600, fontSize: 15,
            padding: '14px 22px', borderRadius: 999, letterSpacing: -0.1,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 6px 14px rgba(31,26,20,0.22)',
            WebkitTapHighlightColor: 'transparent', flexShrink: 0,
          }}>
          Book it
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </main>
  )
}
