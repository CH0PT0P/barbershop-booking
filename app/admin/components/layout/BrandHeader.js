// BrandHeader — the top of the Day View screen.
// Shows the "Dev the Barber" wordmark, a greeting, the Log out pill, and
// the compact 2-stat row (Today / This week).
//
// Props:
//   todayCount   — number of booked appointments today
//   weekCount    — number of booked appointments this week (Mon-Sun)
//   onLogout     — handler for the Log out pill

import Stat from './Stat'

export default function BrandHeader({
  todayCount = 0,
  weekCount = 0,
  onLogout,
}) {
  // Pick a greeting based on time of day. Pure cosmetic touch.
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  return (
    <div className="px-[22px] pt-1 pb-[14px]">
      {/* Top row: wordmark + Log out */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-[6px]">
            <span className="wordmark text-[30px] font-medium text-pullman tracking-[-0.4px]">
              Dev
            </span>
            <span className="text-[28px] font-bold text-body tracking-[-0.6px]">
              the Barber
            </span>
          </div>
          <div className="text-[13px] text-muted mt-[2px] tracking-[0.1px]">
            Admin · {greeting}, Dev
          </div>
        </div>
        <button
          onClick={onLogout}
          className="
            border-hairline border-[color:var(--color-hairline)]
            bg-transparent rounded-full
            px-3 py-[6px] text-[13px] font-medium text-muted
            active:scale-95 transition-transform
          "
        >
          Log out
        </button>
      </div>

      {/* Compact stat row */}
      <div
        className="
          mt-[14px] flex items-center
          bg-eggshell-soft rounded-[14px]
          border-hairline border-[color:var(--color-hairline)]
        "
      >
        <Stat label="Today" value={todayCount} accent="text-pullman" />
        <Divider />
        <Stat label="This week" value={weekCount} accent="text-body" />
      </div>
    </div>
  )
}

// Thin vertical line between stats.
function Divider() {
  return (
    <div className="w-[0.5px] h-7 bg-[color:var(--color-hairline)]" />
  )
}