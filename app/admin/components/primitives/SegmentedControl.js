// SegmentedControl — the iOS-style pill switcher.
// Used on the Hours screen for "Weekly / Date overrides".
//
// Props:
//   options  — array of strings, the labels
//   value    — currently active option (must match one of the options)
//   onChange — called with the new option when tapped

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      className="
        flex p-[3px] bg-eggshell-soft rounded-[11px]
        border-hairline border-[color:var(--color-hairline)]
      "
    >
      {options.map(opt => {
        const isActive = opt === value
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange && onChange(opt)}
            className={`
              flex-1 px-3 py-2 rounded-lg
              text-[13px] font-bold tracking-[-0.1px]
              transition-all duration-150
              ${isActive
                ? 'bg-white text-body shadow-seg'
                : 'bg-transparent text-muted'}
            `}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}