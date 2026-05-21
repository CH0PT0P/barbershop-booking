// Service color mapping — used by appointment blocks, chips, tiles, etc.
// Each service maps to four colors:
//   bg    — light tint, used as card background
//   bar   — saturated, used as 4px left border and chip dots
//   text  — dark, used for text on the tinted background
//   solid — medium, used if we ever want a fully-filled card style
//
// The class strings below let us write `bg-${color.bg}` style code
// elsewhere — they reference the @theme tokens in globals.css.

export const SERVICE_COLORS = {
  "Men's Cut": {
    bg: '#E5ECF8',
    bar: '#2C5BB3',
    text: '#1F4B96',
    solid: '#3B6CB3',
    bgClass: 'bg-mens-bg',
    barClass: 'border-mens-bar',
    barBgClass: 'bg-mens-bar',
    textClass: 'text-mens-text',
  },
  'Kids Cut': {
    bg: '#EBE3F8',
    bar: '#6E3FC9',
    text: '#5A2EAE',
    solid: '#7E4DD8',
    bgClass: 'bg-kids-bg',
    barClass: 'border-kids-bar',
    barBgClass: 'bg-kids-bar',
    textClass: 'text-kids-text',
  },
  'Beard Trim': {
    bg: '#E2F1E8',
    bar: '#2D8A52',
    text: '#1F6B3D',
    solid: '#3D9A62',
    bgClass: 'bg-beard-bg',
    barClass: 'border-beard-bar',
    barBgClass: 'bg-beard-bar',
    textClass: 'text-beard-text',
  },
  'Mullet Trim': {
    bg: '#F8E6D4',
    bar: '#C56312',
    text: '#9E4E0B',
    solid: '#D67423',
    bgClass: 'bg-mullet-bg',
    barClass: 'border-mullet-bar',
    barBgClass: 'bg-mullet-bar',
    textClass: 'text-mullet-text',
  },
}

// Service durations (in minutes) — matches the rest of the codebase.
export const SERVICE_DURATIONS = {
  "Men's Cut": 40,
  'Kids Cut': 30,
  'Beard Trim': 15,
  'Mullet Trim': 15,
}

// Service prices (in dollars).
export const SERVICE_PRICES = {
  "Men's Cut": 35,
  'Kids Cut': 25,
  'Beard Trim': 15,
  'Mullet Trim': 15,
}

// Safe lookup — if a service name isn't recognized (shouldn't happen, but
// just in case), fall back to Men's Cut colors so we never render broken.
export function getServiceColor(service) {
  return SERVICE_COLORS[service] || SERVICE_COLORS["Men's Cut"]
}

export function getServiceDuration(service) {
  return SERVICE_DURATIONS[service] ?? 30
}

export function getServicePrice(service) {
  return SERVICE_PRICES[service] ?? 0
}