'use client'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'

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

const SERVICES = [
  {
    id: 'mens',
    name: "Men's Cut",
    price: 35,
    duration: 40,
    tag: 'Most booked',
    blurb: 'A bespoke cut tailored to you. Because no two clients are the same.',
    color: 'terra',
    accent: '#D9663A',
    rotate: -2.5,
  },
  {
    id: 'kids',
    name: 'Kids Cut',
    price: 25,
    duration: 30,
    tag: '14 & under',
    blurb: 'Tots to teens — give them the confidence to tackle life.',
    color: 'mustard',
    accent: '#D9A53A',
    rotate: 2.2,
  },
  {
    id: 'beard',
    name: 'Beard Trim',
    price: 15,
    duration: 15,
    tag: null,
    blurb: 'Shaped, lined, and looking sharp.',
    color: 'sage',
    accent: '#7A9457',
    rotate: 1.8,
  },
  {
    id: 'mullet',
    name: 'Mullet Trim',
    price: 15,
    duration: 15,
    tag: 'New',
    blurb: 'Business in the front, party in the back. Sides and neckline only.',
    color: 'plum',
    accent: '#A6536F',
    rotate: -1.6,
  },
]

// SVG Icons
function ScissorsIcon({ size = 44, color = PAL.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="13" cy="34" r="6" stroke={color} strokeWidth="2"/>
      <circle cx="35" cy="34" r="6" stroke={color} strokeWidth="2"/>
      <path d="M17.5 30 L40 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M30.5 30 L8 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 23 L26 23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function KidIcon({ size = 44, color = PAL.ink }) {
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

function BeardIcon({ size = 44, color = PAL.ink }) {
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

function MulletIcon({ size = 44, color = PAL.ink }) {
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

const ICONS = {
  mens: ScissorsIcon,
  kids: KidIcon,
  beard: BeardIcon,
  mullet: MulletIcon,
}

function StickerCard({ service, count, onAdd }) {
  const Icon = ICONS[service.id]
  const selected = count > 0
  const fill = service.accent + 'E6'

  return (
    <button
      onClick={onAdd}
      style={{
        position: 'relative',
        border: 0,
        padding: 0,
        background: 'transparent',
        textAlign: 'left',
        transform: `rotate(${selected ? 0 : service.rotate}deg) scale(${selected ? 1.03 : 1})`,
        width: '100%',
        height: 220,
        transition: 'transform 0.18s cubic-bezier(.2,.9,.3,1.4)',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      {/* Tape */}
      <div style={{
        position: 'absolute', top: -6, left: '50%',
        transform: 'translateX(-50%) rotate(-3deg)',
        width: 40, height: 13,
        background: 'rgba(217,166,58,0.45)',
        border: '0.5px solid rgba(31,26,20,0.12)',
        zIndex: 4,
      }}/>

      {/* Card background with dashed border */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 6px 8px rgba(31,26,20,0.10))' }}>
        <rect x="2" y="2" width="96" height="96" rx="14" ry="14"
              fill={fill}
              stroke="rgba(31,26,20,0.85)" strokeWidth="0.6"
              strokeDasharray="0.6 0.9"/>
        <rect x="4.5" y="4.5" width="91" height="91" rx="11" ry="11"
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7"/>
      </svg>

      {/* Count badge */}
      {selected && (
        <div style={{
          position: 'absolute', top: -10, left: -8, zIndex: 6,
          width: 32, height: 32, borderRadius: '50%',
          background: PAL.ink, color: PAL.paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18,
          border: `2.5px solid ${PAL.paper}`,
          boxShadow: '0 4px 10px rgba(31,26,20,0.25)',
          transform: 'rotate(-8deg)',
        }}>×{count}</div>
      )}

      {/* Tag */}
      {service.tag && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 3,
          fontFamily: 'var(--font-hand)', fontSize: 16, color: PAL.ink,
          background: PAL.paper, padding: '1px 8px', borderRadius: 99,
          transform: 'rotate(5deg)', lineHeight: 1.3,
          border: '1px solid rgba(31,26,20,0.18)',
        }}>{service.tag}</div>
      )}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', height: '100%',
        padding: '14px 14px 12px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ marginTop: 6 }}>
          <Icon size={48} color={PAL.ink}/>
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.0,
          color: PAL.ink, letterSpacing: -0.5, marginTop: 6,
        }}>{service.name}</div>
        <div style={{
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontSize: 11, color: 'rgba(31,26,20,0.75)',
          marginTop: 4, lineHeight: 1.35, flex: 1,
        }}>{service.blurb}</div>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginTop: 6,
        }}>
          <div style={{
            fontFamily: 'var(--font-hand)', fontSize: 16, color: PAL.ink,
          }}>{service.duration} min</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 28,
            color: PAL.ink, lineHeight: 1, fontStyle: 'italic',
          }}>${service.price}</div>
        </div>
      </div>
    </button>
  )
}

function BookingDrawer({ bookings, onChangeName, onRemove, onClear, open, setOpen, onContinue }) {
  const total = bookings.reduce((sum, b) => sum + b.price, 0)
  const totalMin = bookings.reduce((sum, b) => sum + b.duration, 0)
  const count = bookings.length
  const empty = count === 0

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
    }}>
      <div style={{
        background: PAL.paper,
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 30px rgba(31,26,20,0.18)',
        borderTop: '0.5px solid rgba(31,26,20,0.12)',
        overflow: 'hidden',
        maxHeight: open ? 460 : 110,
        transition: 'max-height 0.32s cubic-bezier(.2,.7,.2,1)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 2 }}>
          <div style={{ width: 38, height: 5, borderRadius: 99, background: 'rgba(31,26,20,0.25)' }}/>
        </div>

        {/* Header */}
        <div
          onClick={() => !empty && setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px 10px', cursor: empty ? 'default' : 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {empty ? (
              <div style={{
                fontFamily: 'var(--font-hand)', fontSize: 20,
                color: PAL.ink2, lineHeight: 1.1,
              }}>tap a sticker to get started —</div>
            ) : (
              <>
                <div style={{
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: 1.6, color: PAL.terra, textTransform: 'uppercase',
                }}>Booking</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    fontSize: 26, color: PAL.ink, letterSpacing: -0.4, lineHeight: 1,
                  }}>${total}</div>
                  <div style={{
                    fontFamily: '-apple-system, system-ui, sans-serif',
                    fontSize: 12, color: PAL.ink2,
                  }}>· {count} {count === 1 ? 'service' : 'services'} · {totalMin} min</div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); if (!empty) onContinue() }}
            style={{
              border: 0, cursor: empty ? 'default' : 'pointer',
              background: empty ? 'rgba(31,26,20,0.08)' : PAL.ink,
              color: empty ? PAL.ink3 : PAL.paper,
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontWeight: 600, fontSize: 14,
              padding: '12px 18px', borderRadius: 999,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: empty ? 'none' : '0 6px 14px rgba(31,26,20,0.22)',
              transition: 'all 0.2s',
            }}
          >
            {empty ? 'Pick a service' : (count > 1 ? `Book all ${count}` : 'Continue')}
            {!empty && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Expanded list */}
        {!empty && (
          <div style={{
            padding: '4px 16px 18px',
            display: 'flex', flexDirection: 'column', gap: 8,
            opacity: open ? 1 : 0,
            transition: 'opacity 0.22s',
            pointerEvents: open ? 'auto' : 'none',
            maxHeight: 320, overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: 'var(--font-hand)', fontSize: 18,
              color: PAL.ink2, marginBottom: -2, padding: '0 2px',
            }}>who's it for?</div>

            {bookings.map((b) => {
              const Icon = ICONS[b.id]
              const accent = SERVICES.find(s => s.id === b.id)?.accent || PAL.terra
              return (
                <div key={b.uid} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: PAL.card, borderRadius: 16, padding: '10px 12px',
                  border: '0.5px solid rgba(31,26,20,0.10)',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: accent + '2E',
                    border: `1px solid ${accent}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={26} color={PAL.ink}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: 18,
                      color: PAL.ink, letterSpacing: -0.2,
                    }}>{b.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <div style={{
                        fontFamily: 'var(--font-hand)', fontSize: 15,
                        color: PAL.ink3, lineHeight: 1,
                      }}>for</div>
                      <input
                        type="text"
                        placeholder="name…"
                        value={b.who}
                        onChange={(e) => onChangeName(b.uid, e.target.value)}
                        style={{
                          flex: 1, border: 0, outline: 0, padding: '2px 0',
                          background: 'transparent',
                          borderBottom: `1.2px dashed ${PAL.ink3}88`,
                          fontFamily: 'var(--font-hand)', fontSize: 17,
                          color: PAL.ink, lineHeight: 1.1,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                      fontSize: 20, color: PAL.ink, lineHeight: 1,
                    }}>${b.price}</div>
                    <button
                      onClick={() => onRemove(b.uid)}
                      style={{
                        border: 0, background: 'transparent', cursor: 'pointer',
                        fontFamily: '-apple-system, system-ui, sans-serif',
                        fontSize: 11, color: PAL.ink3,
                        textDecoration: 'underline', padding: '4px 0 0',
                      }}>remove</button>
                  </div>
                </div>
              )
            })}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginTop: 6, padding: '0 4px',
            }}>
              <div style={{
                fontFamily: 'var(--font-hand)', fontSize: 16, color: PAL.ink2,
              }}>tap a sticker to add another →</div>
              <button
                onClick={onClear}
                style={{
                  border: 0, background: 'transparent', cursor: 'pointer',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  fontSize: 12, color: PAL.ink3, textDecoration: 'underline',
                }}>clear all</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [open, setOpen] = useState(false)
  const uidRef = useRef(1)

  function add(service) {
    const uid = uidRef.current++
    setBookings(prev => [...prev, {
      uid, id: service.id, name: service.name,
      price: service.price, duration: service.duration,
      color: service.color, who: '',
    }])
    setOpen(true)
  }

  function changeName(uid, who) {
    setBookings(prev => prev.map(b => b.uid === uid ? { ...b, who } : b))
  }

  function remove(uid) {
    setBookings(prev => prev.filter(b => b.uid !== uid))
  }

  function clear() {
    setBookings([])
    setOpen(false)
  }

  function handleContinue() {
    if (bookings.length === 0) return
    // Save to localStorage — supports multiple bookings
    localStorage.setItem('selectedServices', JSON.stringify(bookings))
    // Keep backwards compatibility for single booking
    const first = bookings[0]
    localStorage.setItem('selectedService', JSON.stringify({
      name: first.name, price: first.price, duration: first.duration
    }))
    router.push('/book/date')
  }

  const countById = (id) => bookings.filter(b => b.id === id).length
  const padBottom = bookings.length === 0 ? 120 : (open ? 460 : 120)

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: PAL.bg,
      fontFamily: '-apple-system, system-ui, sans-serif',
      color: PAL.ink,
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Paper grain texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(31,26,20,0.06) 1px, transparent 1px)',
        backgroundSize: '4px 4px', opacity: 0.55,
        mixBlendMode: 'multiply', zIndex: 0,
      }}/>

      <div style={{
        position: 'relative', zIndex: 1,
        padding: `54px 20px ${padBottom}px`,
        transition: 'padding-bottom 0.32s cubic-bezier(.2,.7,.2,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '0 4px 16px', position: 'relative' }}>
          {/* Star doodle */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
               style={{ position: 'absolute', top: 4, right: 4, transform: 'rotate(8deg)' }}>
            <path d="M12 3 L13.5 9 L20 10 L15 14 L16.5 21 L12 17 L7.5 21 L9 14 L4 10 L10.5 9 Z"
                  stroke={PAL.terra} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          </svg>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 38, lineHeight: 1.05,
            letterSpacing: -1.0, margin: 0, color: PAL.ink,
            fontWeight: 400, maxWidth: 260,
          }}>Pick a sticker</h1>
          <div style={{
            fontFamily: 'var(--font-hand)', fontSize: 20, color: PAL.ink2,
            lineHeight: 1.2, marginTop: 8,
            transform: 'rotate(-1.5deg)', transformOrigin: 'left',
          }}>tap one for you, two for the kids, all of em —</div>
        </div>

        {/* Sticker grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '24px 14px', paddingTop: 12, position: 'relative',
        }}>
          {/* Arrow doodle between cards */}
          <svg width="36" height="36" viewBox="0 0 40 40"
               style={{
                 position: 'absolute', top: 130, left: '47%',
                 transform: 'translateX(-50%) rotate(8deg)', zIndex: 5,
               }}>
            <path d="M5 28 C 12 8, 22 8, 30 22 M22 17 L30 22 L26 30"
                  stroke={PAL.ink} strokeWidth="2" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {SERVICES.map(service => (
            <StickerCard
              key={service.id}
              service={service}
              count={countById(service.id)}
              onAdd={() => add(service)}
            />
          ))}
        </div>
      </div>

      <BookingDrawer
        bookings={bookings}
        onChangeName={changeName}
        onRemove={remove}
        onClear={clear}
        open={open}
        setOpen={setOpen}
        onContinue={handleContinue}
      />
    </main>
  )
}