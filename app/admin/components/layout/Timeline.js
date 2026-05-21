// Timeline — the vertical appointment calendar for the Day View.
//
// Visual structure:
//   [gutter 44px] | [timeline area — flex-1]
//
// The gutter shows hour labels (9a, 10a … 7p) right-aligned against the
// timeline edge. The timeline area has thin hour-divider lines and
// absolutely-positioned appointment blocks.
//
// Sizing math:
//   PX_PER_HOUR = 84        → each hour is exactly 84px tall
//   PX_PER_MIN  = 84 / 60  → 1.4px per minute
//   DAY_START   = 9         → 9 AM
//   DAY_END     = 19        → 7 PM  (10 hours → 840px total)
//   min block height = 28px (so 15-min appts are still readable)
//
// Props:
//   appointments  — array from Supabase: { id, time, service, clients, notes }
//   loading       — boolean; shows a centered loading message when true
//   onSelectAppt  — called with the appointment object when a block is tapped
//   onTapEmpty    — called with minutes-since-midnight when empty space is tapped

'use client'

import { useState, useEffect } from 'react'
import { getServiceColor, getServiceDuration } from '../../../lib/serviceColors'
import { timeStringToMinutes, fmtShort, todayString } from '../../../lib/time'

const PX_PER_HOUR = 84
const PX_PER_MIN  = PX_PER_HOUR / 60   // 1.4
const DAY_START   = 9                   // 9 AM (inclusive)
const DAY_END     = 19                  // 7 PM (inclusive — last label only)
const TOTAL_HEIGHT = (DAY_END - DAY_START) * PX_PER_HOUR  // 840px
const GUTTER_W    = 44                  // px — width of the left hour-label column
const BLOCK_INSET = 6                   // px — gap between gutter edge and block

// Array of hour integers: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

// Convert "HH:MM:SS" time string to a pixel offset from the top of the timeline.
function timeToTop(timeStr) {
  const startMin = timeStringToMinutes(timeStr)
  return (startMin - DAY_START * 60) * PX_PER_MIN
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export default function Timeline({ appointments = [], loading = false, onSelectAppt, onTapEmpty, viewDate }) {
  const [currentMin, setCurrentMin] = useState(nowMinutes)

  // Tick every minute so the line stays accurate.
  useEffect(() => {
    const id = setInterval(() => setCurrentMin(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isToday     = viewDate === todayString()
  const nowTop      = (currentMin - DAY_START * 60) * PX_PER_MIN
  const showNowLine = isToday && currentMin >= DAY_START * 60 && currentMin <= DAY_END * 60

  // Tap on empty space: convert the Y position to a 15-min-snapped time.
  // e.currentTarget.getBoundingClientRect() accounts for scroll offset correctly
  // because both clientY and rect.top are in viewport coordinates.
  function handleAreaTap(e) {
    if (!onTapEmpty) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const rawMinutes = DAY_START * 60 + (y / PX_PER_HOUR) * 60
    const snapped = Math.round(rawMinutes / 15) * 15
    const clamped = Math.max(DAY_START * 60, Math.min(DAY_END * 60 - 15, snapped))
    onTapEmpty(clamped)
  }

  return (
    // Outer row: gutter on left, timeline area on right.
    // The total height is fixed (TOTAL_HEIGHT px). The parent scroll container
    // handles overflow — this component is not itself scrollable.
    <div
      className="relative flex"
      style={{ height: TOTAL_HEIGHT, minHeight: TOTAL_HEIGHT }}
    >

      {/* ── Left gutter: hour labels ──────────────────────────────── */}
      <div
        className="flex-shrink-0 relative"
        style={{ width: GUTTER_W }}
      >
        {HOURS.map(h => (
          <div
            key={h}
            className="
              absolute right-2
              text-[11px] font-medium text-muted tnum leading-none
              select-none
            "
            // Shift the label up by ~6px so its baseline sits ON the hour line,
            // not below it. (The hour line is at top = (h - DAY_START) * 84px.)
            style={{ top: (h - DAY_START) * PX_PER_HOUR - 6 }}
          >
            {fmtShort(h * 60)}
          </div>
        ))}
      </div>

      {/* ── Timeline area: dividers + appointment blocks ─────────── */}
      <div
        className="flex-1 relative"
        onClick={handleAreaTap}
        style={{ cursor: onTapEmpty ? 'pointer' : 'default' }}
      >

        {/* Hour divider lines — one per hour including DAY_END */}
        {HOURS.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0"
            style={{
              top: (h - DAY_START) * PX_PER_HOUR,
              borderTop: '0.5px solid var(--color-divider)',
            }}
          />
        ))}

        {/* Current time indicator — only on today */}
        {showNowLine && (
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
            style={{ top: nowTop }}
          >
            <div
              className="flex-shrink-0 rounded-full bg-red-500"
              style={{ width: 8, height: 8, marginLeft: -4 }}
            />
            <div className="flex-1" style={{ height: 1.5, background: '#ef4444' }} />
          </div>
        )}

        {/* Appointment blocks */}
        {appointments.map(appt => {
          const startMin  = timeStringToMinutes(appt.time)
          const duration  = getServiceDuration(appt.service)
          const endMin    = startMin + duration
          const svc       = getServiceColor(appt.service)

          const top    = timeToTop(appt.time)
          const height = Math.max(duration * PX_PER_MIN, 28)

          // Show service name on a second row only when there's room.
          const showService = height >= 40

          return (
            <button
              key={appt.id}
              onClick={(e) => { e.stopPropagation(); onSelectAppt?.(appt) }}
              className={`
                absolute rounded-[10px] border-l-4 overflow-hidden
                px-[8px] py-[4px] text-left w-auto
                active:opacity-75 transition-opacity
                ${svc.bgClass} ${svc.barClass} ${svc.textClass}
              `}
              style={{
                top,
                height,
                left: BLOCK_INSET,
                right: BLOCK_INSET,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Row 1: client name + time range */}
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[12px] font-bold leading-tight truncate">
                  {appt.clients?.name}
                  {appt.notes ? ' ·' : ''}
                </span>
                <span className="text-[10px] tnum opacity-70 flex-shrink-0 leading-tight">
                  {fmtShort(startMin)} · {fmtShort(endMin)}
                </span>
              </div>

              {/* Row 2: service name — only if block is tall enough */}
              {showService && (
                <div className="text-[11px] leading-tight opacity-75 truncate mt-[1px]">
                  {appt.service}
                </div>
              )}
            </button>
          )
        })}

        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-[14px]">Loading…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && appointments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-[14px]">Nothing scheduled</p>
          </div>
        )}

      </div>
    </div>
  )
}
