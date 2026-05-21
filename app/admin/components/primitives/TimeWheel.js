'use client'

// TimeWheel — iOS-style drum picker for selecting a time.
//
// Three columns: hour (1–12) · minute (00, 05 … 55) · AM/PM
// A highlight band sits across the center row. A gradient fades the
// rows above and below so the drum effect is visible.
//
// Props:
//   value    — minutes since midnight (e.g. 780 = 1:00 PM)
//   onChange — called with new minutes-since-midnight when the user scrolls

import { useRef, useEffect, useLayoutEffect } from 'react'

const ITEM_H  = 44                // px — height of each row
const VISIBLE = 5                 // rows shown at once
const PAD     = Math.floor(VISIBLE / 2)   // = 2 rows of padding top + bottom
const WHEEL_H = ITEM_H * VISIBLE  // = 220px total

const HOURS   = [1,2,3,4,5,6,7,8,9,10,11,12]
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)  // 0,5,10…55
const AMPM    = ['AM', 'PM']

// ─── WheelColumn ─────────────────────────────────────────────────────────────
// A single vertically-scrolling drum column with CSS scroll-snap.

function WheelColumn({ items, selectedIndex, onSelect, formatFn = String }) {
  const ref      = useRef(null)
  const debounce = useRef(null)

  // Set initial scroll position instantly (no animation) so there's no flash.
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = selectedIndex * ITEM_H
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Smoothly scroll to new selectedIndex when it changes from outside
  // (e.g. pre-filled value changes). Skip if we're already there.
  useEffect(() => {
    if (!ref.current) return
    const already = Math.round(ref.current.scrollTop / ITEM_H)
    if (already === selectedIndex) return
    ref.current.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'smooth' })
  }, [selectedIndex])

  // After the user stops scrolling, read the snapped position and notify parent.
  function handleScroll() {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      onSelect(clamped)
    }, 80)
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{
        flex: 1,
        height: WHEEL_H,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        // Hide scrollbar cross-browser
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Top padding — keeps first real item centerable */}
      {Array.from({ length: PAD }).map((_, i) => (
        <div key={`t${i}`} style={{ height: ITEM_H, scrollSnapAlign: 'center' }} />
      ))}

      {items.map((item, i) => (
        <div
          key={i}
          style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          className="flex items-center justify-center"
        >
          <span className="text-[22px] font-semibold tnum text-body select-none">
            {formatFn(item)}
          </span>
        </div>
      ))}

      {/* Bottom padding — keeps last real item centerable */}
      {Array.from({ length: PAD }).map((_, i) => (
        <div key={`b${i}`} style={{ height: ITEM_H, scrollSnapAlign: 'center' }} />
      ))}
    </div>
  )
}

// ─── TimeWheel ────────────────────────────────────────────────────────────────

export default function TimeWheel({ value = 11 * 60, onChange }) {
  // Decompose minutes-since-midnight into 12h components
  const totalH    = Math.floor(value / 60)
  const rawMins   = value % 60
  const isPM      = totalH >= 12
  const h12       = totalH % 12 || 12

  // Snap minutes to nearest 5 for the column index
  const snappedMin = Math.round(rawMins / 5) * 5 % 60

  const hourIdx  = Math.max(0, HOURS.indexOf(h12))
  const minIdx   = Math.max(0, MINUTES.indexOf(snappedMin))
  const ampmIdx  = isPM ? 1 : 0

  // Re-compose minutes-since-midnight from updated 12h components
  function toMinutes(h12val, minVal, pmVal) {
    let h24
    if (pmVal) {
      h24 = h12val === 12 ? 12 : h12val + 12
    } else {
      h24 = h12val === 12 ? 0 : h12val
    }
    return h24 * 60 + minVal
  }

  function handleHour(idx) {
    onChange(toMinutes(HOURS[idx], snappedMin, isPM))
  }

  function handleMinute(idx) {
    onChange(toMinutes(h12, MINUTES[idx], isPM))
  }

  function handleAmPm(idx) {
    onChange(toMinutes(h12, snappedMin, idx === 1))
  }

  return (
    <div className="relative select-none" style={{ height: WHEEL_H }}>

      {/* The three scrollable columns */}
      <div className="flex h-full">
        <WheelColumn
          items={HOURS}
          selectedIndex={hourIdx}
          onSelect={handleHour}
        />
        <WheelColumn
          items={MINUTES}
          selectedIndex={minIdx}
          onSelect={handleMinute}
          formatFn={m => String(m).padStart(2, '0')}
        />
        <WheelColumn
          items={AMPM}
          selectedIndex={ampmIdx}
          onSelect={handleAmPm}
        />
      </div>

      {/* Highlight band — the "selected" row indicator */}
      <div
        className="absolute left-2 right-2 rounded-[10px] pointer-events-none"
        style={{
          top: ITEM_H * PAD,
          height: ITEM_H,
          background: 'rgba(85,59,8,0.07)',
          zIndex: 1,
        }}
      />

      {/* Gradient fade — creates the drum/cylinder depth illusion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, white 0%, rgba(255,255,255,0.55) 22%, transparent 38%, transparent 62%, rgba(255,255,255,0.55) 78%, white 100%)',
          zIndex: 2,
        }}
      />

    </div>
  )
}
