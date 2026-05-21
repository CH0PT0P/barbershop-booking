// Stat — a single stat tile inside the compact stat row.
// Used three times in BrandHeader (Today / Upcoming / This week).
//
// Props:
//   label   — caption text ("Today")
//   value   — big number to display
//   accent  — Tailwind text-color class for the number (e.g. "text-pullman")

export default function Stat({ label, value, accent = 'text-body' }) {
  return (
    <div className="flex-1 px-3 py-[10px] flex items-center gap-2">
      <div
        className={`
          text-[22px] font-bold tracking-[-0.5px] tnum min-w-[22px]
          ${accent}
        `}
      >
        {value}
      </div>
      <div className="text-[12px] text-muted leading-tight">
        {label}
      </div>
    </div>
  )
}