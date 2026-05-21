// DateStrip — the eggshell pill with left/right chevrons and a date label.
// Shown on the Day View just below the stats.
//
// Props:
//   label        — text to display in the middle (e.g. "Thursday, May 28")
//   onPrev       — handler for the left chevron (previous day)
//   onNext       — handler for the right chevron (next day)
//   dateValue    — current date as "YYYY-MM-DD"; when provided, tapping the
//                  label opens the native date picker via an invisible overlay input
//   onDateChange — called with the new "YYYY-MM-DD" string when a date is picked

import Icon from './Icon'

export default function DateStrip({ label, onPrev, onNext, dateValue, onDateChange }) {
  return (
    <div
      className="
        mx-4 mt-[6px] mb-[14px]
        bg-eggshell-soft rounded-full
        border-hairline border-[color:var(--color-hairline)]
        flex items-center justify-between
        px-[6px] py-1
      "
    >
      <ChevronButton onClick={onPrev} direction="left" />

      {/* Label — relative so the invisible date input can sit on top */}
      <div className="relative flex-1 flex items-center justify-center">
        <span className="text-[15px] font-semibold text-body tracking-[-0.2px] select-none">
          {label}
        </span>
        {dateValue !== undefined && (
          <input
            type="date"
            value={dateValue}
            onChange={e => e.target.value && onDateChange?.(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        )}
      </div>

      <ChevronButton onClick={onNext} direction="right" />
    </div>
  )
}

function ChevronButton({ onClick, direction }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-9 h-9 rounded-full
        flex items-center justify-center
        text-body
        active:bg-eggshell active:scale-95
        transition-all
      "
      aria-label={direction === 'left' ? 'Previous day' : 'Next day'}
    >
      <Icon
        name={direction === 'left' ? 'chevronLeft' : 'chevronRight'}
        size={18}
      />
    </button>
  )
}