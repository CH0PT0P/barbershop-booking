// GhostButton — the outlined secondary button.
// Used for less-important actions next to a PrimaryButton, or for destructive
// actions (Cancel) when given the `danger` prop.
//
// Props:
//   children   — the button label
//   onClick    — click handler
//   fullWidth  — when true, stretches to fill the parent container
//   danger     — when true, renders red text + red border (for Cancel)
//   icon       — optional icon node to show before the label

export default function GhostButton({
  children,
  onClick,
  fullWidth = false,
  danger = false,
  icon = null,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${fullWidth ? 'w-full' : ''}
        rounded-[14px] px-[22px] py-[14px]
        text-[17px] font-semibold tracking-[-0.2px]
        bg-white border
        inline-flex items-center justify-center gap-2
        transition-all duration-150
        active:scale-[0.98]
        ${danger
          ? 'border-danger text-danger'
          : 'border-hairline text-body hover:bg-eggshell-soft'}
      `}
    >
      {icon}
      {children}
    </button>
  )
}