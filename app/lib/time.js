// Time helpers — used everywhere time is displayed.
//
// We work in "minutes since midnight" internally because it makes math
// trivial: appointment height on the timeline, slot intervals, etc.
// Database stores time as "HH:MM:SS" strings, so we convert at the edges.

// ─── Minutes-since-midnight helpers ───────────────────────────────

// Build minutes from hours + optional minutes: min(13, 30) === 810
export const min = (h, m = 0) => h * 60 + m

// Convert "14:30:00" or "14:30" (the format Supabase returns) to 870 minutes
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Convert 870 minutes back to "14:30" (the format Supabase wants for inserts)
export function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// ─── Display formatters ───────────────────────────────────────────

// Long form: "1:30 PM" / "12:00 PM"
export function fmt(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${m.toString().padStart(2, '0')} ${ap}`
}

// Short form: "1:30p" / "12p" / "9a"
// Used on the timeline (where space is tight) and on row time-chips.
export function fmtShort(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ap = h >= 12 ? 'p' : 'a'
  const h12 = ((h + 11) % 12) + 1
  return m === 0 ? `${h12}${ap}` : `${h12}:${m.toString().padStart(2, '0')}${ap}`
}

// ─── Date helpers ─────────────────────────────────────────────────

// "2026-05-28" -> Date object (in local timezone)
// The +T00:00:00 forces local interpretation; otherwise it'd parse as UTC
// and could shift the date by a day.
export function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

// Date object -> "2026-05-28" (the format Supabase wants for date columns)
export function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "2026-05-28" -> "Thursday, May 28"
export function formatLongDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })
}

// "2026-05-28" -> "Thu, May 28"  (used in Upcoming group headers)
export function formatShortDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

// Today as "2026-05-28"
export function todayString() {
  return toDateString(new Date())
}

// ─── Phone helpers ────────────────────────────────────────────────

// "2606097111" -> "(260) 609-7111"
export function formatPhone(phone) {
  if (!phone) return ''
  const d = phone.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return phone
}

// ─── Week helpers ─────────────────────────────────────────────────

// Returns ISO date strings for Monday and Sunday of the current week.
// Used by the "This week" stat in the BrandHeader.
export function thisWeekRange() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ... 6=Sat
  // How many days back to Monday? If today is Sunday (0), go back 6 days.
  // Otherwise go back (day - 1) days.
  const daysToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: toDateString(monday),
    end: toDateString(sunday),
  }
}