// PrimaryButton — the brown CTA button.
// Used for the most important action on a screen (Confirm, Mark complete, etc.)
//
// Props:
//   children   — the button label
//   onClick    — click handler
//   disabled   — when true, renders a muted gray version
//   fullWidth  — when true, stretches to fill the parent container
//   type       — defaults to "button" (so it doesn't accidentally submit forms)

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        rounded-[14px] px-[22px] py-[15px]
        text-[17px] font-semibold tracking-[-0.2px]
        transition-all duration-150
        active:scale-[0.98]
        ${disabled
          ? 'bg-[#D4CFC2] text-[#807868] cursor-not-allowed'
          : 'bg-pullman text-white shadow-cta hover:opacity-95'}
      `}
    >
      {children}
    </button>
  )
}