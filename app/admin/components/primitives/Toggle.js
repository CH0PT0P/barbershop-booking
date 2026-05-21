// Toggle — iOS-style switch.
// Used on the Hours screen to mark a weekday open/closed.
//
// Props:
//   on        — boolean, current state
//   onChange  — called with the new boolean when tapped
//   disabled  — when true, can't be toggled and looks slightly muted

export default function Toggle({ on, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange && onChange(!on)}
      className={`
        relative w-[42px] h-[26px] rounded-full flex-shrink-0
        transition-colors duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${on ? 'bg-pullman' : 'bg-[#D6D2C5]'}
      `}
    >
      <span
        className="
          absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white
          shadow-[0_1px_3px_rgba(0,0,0,0.25)]
          transition-all duration-150
        "
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  )
}