'use client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import rough from 'roughjs'
import { motion, useMotionValue, animate, useAnimationControls } from 'framer-motion'

const PAL = {
  bg:         '#F3A993',
  card:       '#E66345',
  cardBorder: 'rgba(0,0,0,0.92)',
  cream:      '#FFFCEC',
  ink:        'rgba(0,0,0,0.83)',
  tagGreen:   '#468F6A',
  paper:      '#FBF6E8',
  ink2:       '#5A4F3F',
  ink3:       '#8B8071',
  terra:      '#D9663A',
}

// Figma rotations were in radians; converted to degrees (* 180/π ≈ 57.3)
const SERVICES = [
  {
    id: 'mens',
    name: "Men's Cut",
    price: 35,
    duration: 40,
    tag: 'most booked',
    blurb: 'A bespoke cut tailored to you.',
    rotate: -6,
  },
  {
    id: 'kids',
    name: "Kid's Cut",
    price: 25,
    duration: 30,
    tag: '14 & under',
    blurb: 'Tots to teens — give them the confidence to tackle life.',
    rotate: 6,
  },
  {
    id: 'beard',
    name: 'Beard Trim',
    price: 15,
    duration: 15,
    tag: null,
    blurb: 'Shaped, lined, looking fine. (oof)',
    rotate: 6,
  },
  {
    id: 'mullet',
    name: 'Mullet Trim',
    price: 15,
    duration: 15,
    tag: null,
    blurb: 'Sides and neck only. This is just a touch-up.',
    rotate: -6,
  },
]

function ServiceCard({ service, count, onAdd }) {
  const selected = count > 0
  const btnRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    if (!btnRef.current || !svgRef.current) return

    function draw(w, h) {
      if (!w || !h) return
      const svg = svgRef.current
      svg.innerHTML = ''
      svg.setAttribute('width', w)
      svg.setAttribute('height', h)
      const rc = rough.svg(svg)
      const pad = 5
      svg.appendChild(rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, {
        fill: PAL.card,
        fillStyle: 'solid',
        stroke: 'rgba(0,0,0,0.88)',
        strokeWidth: 3.5,
        roughness: 2.2,
        bowing: 1.2,
      }))
    }

    // Observe the button directly — as a grid item it always has resolved dimensions
    const ro = new ResizeObserver(([entry]) => {
      draw(entry.contentRect.width, entry.contentRect.height)
    })
    ro.observe(btnRef.current)
    // Seed immediately in case ResizeObserver fires late on iOS
    const { width, height } = btnRef.current.getBoundingClientRect()
    draw(width, height)
    return () => ro.disconnect()
  }, [])

  return (
    <button
      ref={btnRef}
      onClick={onAdd}
      style={{
        position: 'relative',
        border: 0,
        padding: 0,
        background: 'transparent',
        textAlign: 'left',
        width: '100%',
        height: '100%',
        transform: `rotate(${selected ? 0 : service.rotate}deg) scale(${selected ? 1.03 : 1})`,
        transition: 'transform 0.2s cubic-bezier(.2,.9,.3,1.4)',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
      }}
    >
      {/* Rough.js brush-stroke border + fill */}
      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {service.tag && (
        <div style={{
          position: 'absolute',
          top: -10, right: 6,
          zIndex: 4,
          background: PAL.tagGreen,
          color: PAL.cream,
          fontFamily: 'var(--font-hand)',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 5,
          transform: 'rotate(17deg)',
          border: '1px solid rgba(0,0,0,0.20)',
          whiteSpace: 'nowrap',
        }}>{service.tag}</div>
      )}

      {selected && (
        <div style={{
          position: 'absolute', top: -10, left: -8, zIndex: 6,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.85)', color: PAL.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17,
          border: `2.5px solid ${PAL.bg}`,
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          transform: 'rotate(-8deg)',
        }}>×{count}</div>
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', height: '100%',
        padding: '14px 12px 12px',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontWeight: 800, fontSize: 15,
          color: PAL.cream, textTransform: 'uppercase',
          letterSpacing: 0.3, lineHeight: 1.1,
        }}>{service.name}</div>

        <div style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 9.5, color: PAL.cream,
          marginTop: 8, lineHeight: 1.5, flex: 1, opacity: 0.88,
        }}>{service.blurb}</div>

        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginTop: 6,
        }}>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: 13, color: PAL.cream }}>{service.duration} min</div>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: PAL.cream, lineHeight: 1 }}>${service.price}</div>
        </div>
      </div>
    </button>
  )
}

function SwipeableItem({ uid, onRemove, name, duration, price }) {
  const controls = useAnimationControls()
  const ref = useRef(null)
  const [removing, setRemoving] = useState(false)
  const [height, setHeight] = useState('auto')

  const SWIPE_THRESHOLD = 80
  const DISMISS_THRESHOLD = 200
  const VELOCITY_THRESHOLD = 600

  const spring = { type: 'spring', stiffness: 500, damping: 50, mass: 1 }

  async function animateOut() {
    if (ref.current) setHeight(ref.current.getBoundingClientRect().height)
    setRemoving(true)
    await controls.start({
      x: '-100%', opacity: 0,
      transition: { x: spring, opacity: { duration: 0.15, ease: 'easeIn', delay: 0.08 } },
    })
    await controls.start({ height: 0, transition: { duration: 0.2, ease: 'easeIn' } })
    onRemove(uid)
  }

  function handleDragEnd(_, info) {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (velocity < -VELOCITY_THRESHOLD || offset < -DISMISS_THRESHOLD) {
      animateOut()
    } else if (offset < -SWIPE_THRESHOLD) {
      controls.start({ x: -80, transition: spring })
    } else {
      controls.start({ x: 0, transition: spring })
    }
  }

  return (
    <motion.div
      ref={ref}
      animate={controls}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height: removing ? height : 'auto',
      }}
    >
      {/* Red delete background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#DC343B',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 16, borderRadius: 16,
      }}>
        <button
          onClick={animateOut}
          style={{
            border: 0, background: 'transparent', cursor: 'pointer',
            color: 'white', fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 13, fontWeight: 600,
          }}>Delete</button>
      </div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.3 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: PAL.paper, borderRadius: 16, padding: '10px 12px',
          border: '0.5px solid rgba(31,26,20,0.10)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: PAL.card + '33',
            border: `1px solid ${PAL.card}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: 18,
          }}>✂</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontWeight: 700, fontSize: 14,
              color: PAL.ink2, textTransform: 'uppercase', letterSpacing: 0.2,
            }}>{name}</div>
            <div style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 11, color: PAL.ink3, marginTop: 2,
            }}>{duration} min · ${price}</div>
          </div>
          <button
            onClick={animateOut}
            style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 0 0', flexShrink: 0,
            }}>
            <ArrowLeft size={14} color={PAL.ink3}/>
            <span style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 11, color: PAL.ink3,
            }}>remove</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function BookingDrawer({ bookings, onRemove, onClear, open, setOpen, onContinue }) {
  const total = bookings.reduce((sum, b) => sum + b.price, 0)
  const totalMin = bookings.reduce((sum, b) => sum + b.duration, 0)
  const count = bookings.length
  const empty = count === 0

  const COLLAPSED_HEIGHT = 110
  const EXPANDED_HEIGHT = 400
  const controls = useAnimationControls()
  const y = useMotionValue(0)

  useEffect(() => {
    controls.start({
      height: open ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 }
    })
  }, [open])

  function handleDragEnd(_, info) {
    const velocity = info.velocity.y
    const offset = info.offset.y

    if (open) {
      if (offset > 80 || velocity > 500) {
        setOpen(false)
        controls.start({
          height: COLLAPSED_HEIGHT,
          transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 }
        })
      } else {
        controls.start({
          height: EXPANDED_HEIGHT,
          transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 }
        })
      }
    } else {
      if (!empty && (offset < -80 || velocity < -500)) {
        setOpen(true)
        controls.start({
          height: EXPANDED_HEIGHT,
          transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 }
        })
      } else {
        controls.start({
          height: COLLAPSED_HEIGHT,
          transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 }
        })
      }
    }
    animate(y, 0, { type: 'spring', stiffness: 400, damping: 40, mass: 1 })
  }

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30 }}>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.4, bottom: 0.1 }}
        dragMomentum={false}
        style={{ y }}
        animate={controls}
        initial={{ height: COLLAPSED_HEIGHT }}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          background: PAL.paper,
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          boxShadow: '0 -10px 30px rgba(31,26,20,0.18)',
          borderTop: '0.5px solid rgba(31,26,20,0.12)',
          overflow: 'hidden',
          height: '100%',
        }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 2 }}>
            <div style={{ width: 38, height: 5, borderRadius: 99, background: 'rgba(31,26,20,0.25)' }}/>
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px 10px',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {empty ? (
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: PAL.ink2 }}>
                  tap a card to get started —
                </div>
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
                background: empty ? 'rgba(31,26,20,0.08)' : PAL.card,
                color: empty ? PAL.ink3 : PAL.cream,
                fontFamily: '-apple-system, system-ui, sans-serif',
                fontWeight: 700, fontSize: 14,
                textTransform: empty ? 'none' : 'uppercase',
                letterSpacing: empty ? 0 : 0.5,
                padding: '12px 18px', borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: empty ? 'none' : '0 6px 14px rgba(230,99,69,0.40)',
                transition: 'all 0.2s',
              }}
            >
              {empty ? 'Pick a service' : count === 1 ? 'Continue' : count === 2 ? 'Book both' : `Book all ${count}`}
              {!empty && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Expanded list */}
          {!empty && (
            <motion.div
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: '4px 16px 18px',
                display: 'flex', flexDirection: 'column', gap: 8,
                pointerEvents: open ? 'auto' : 'none',
                maxHeight: 280, overflowY: 'auto',
              }}
            >
              {bookings.map((b) => (
                <SwipeableItem
                  key={b.uid}
                  uid={b.uid}
                  onRemove={onRemove}
                  name={b.name}
                  duration={b.duration}
                  price={b.price}
                />
              ))}

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 6, padding: '0 4px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-hand)', fontSize: 16, color: PAL.ink2,
                }}>tap a card to add another →</div>
                <button
                  onClick={onClear}
                  style={{
                    border: 0, background: 'transparent', cursor: 'pointer',
                    fontFamily: '-apple-system, system-ui, sans-serif',
                    fontSize: 12, color: PAL.ink3, textDecoration: 'underline',
                  }}>clear all</button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function BookV2Page() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [open, setOpen] = useState(false)
  const uidRef = useRef(1)

  useEffect(() => {
    document.body.style.overscrollBehavior = 'none'
    return () => { document.body.style.overscrollBehavior = '' }
  }, [])

  function add(service) {
    const uid = uidRef.current++
    setBookings(prev => [...prev, { uid, id: service.id, name: service.name, price: service.price, duration: service.duration }])
    setOpen(true)
  }

  function remove(uid) {
    setBookings(prev => {
      const updated = prev.filter(b => b.uid !== uid)
      if (updated.length === 0) setOpen(false)
      return updated
    })
  }

  function clear() {
    setBookings([])
    setOpen(false)
  }

  function handleContinue() {
    if (bookings.length === 0) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedServices', JSON.stringify(bookings))
      localStorage.setItem('selectedService', JSON.stringify({ name: bookings[0].name, price: bookings[0].price, duration: bookings[0].duration }))
    }
    router.push('/book/date')
  }

  const countById = (id) => bookings.filter(b => b.id === id).length

  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: PAL.bg,
      fontFamily: '-apple-system, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%',
        padding: '44px 16px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 10px 48px', flexShrink: 0 }}>
          <h1 style={{
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -1.5,
            margin: 0,
            color: PAL.ink,
          }}>
            Pick your<br/>service(s):
          </h1>
        </div>

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '28px 18px',
          paddingBottom: 124,
        }}>
          {SERVICES.map(service => (
            <ServiceCard
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
        onRemove={remove}
        onClear={clear}
        open={open}
        setOpen={setOpen}
        onContinue={handleContinue}
      />
    </main>
  )
}