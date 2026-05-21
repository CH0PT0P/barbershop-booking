// Card — the standard white rounded container.
// Used for grouping rows (client list, upcoming appointments, schedule, etc.)
//
// Props:
//   children    — content inside the card
//   className   — extra classes to merge in (for one-off tweaks)
//   onClick     — when provided, the card becomes clickable
//   noPadding   — when true, removes the default padding (useful when the
//                 card contains rows that have their own padding)

export default function Card({
  children,
  className = '',
  onClick,
  noPadding = false,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-card border-hairline border-[color:var(--color-hairline)]
        shadow-card overflow-hidden
        ${noPadding ? '' : 'p-4'}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}