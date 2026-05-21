// ScreenHeader — used on every non-home admin screen (Upcoming, Clients,
// New Booking, Hours). Renders an uppercase eyebrow above a large title,
// with an optional trailing element (filter pill, plus button, etc.)
//
// Props:
//   eyebrow   — small uppercase caption above the title ("SCHEDULE")
//   title     — large heading ("Upcoming")
//   trailing  — optional React node, right-aligned

export default function ScreenHeader({ eyebrow, title, trailing }) {
  return (
    <div className="px-[22px] pt-2 pb-[14px] flex items-end gap-[14px]">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <div
            className="
              text-[13px] font-semibold uppercase tracking-[0.6px]
              text-sepia mb-1
            "
          >
            {eyebrow}
          </div>
        )}
        <div className="text-[34px] font-bold tracking-[-0.6px] text-body leading-[1.05]">
          {title}
        </div>
      </div>
      {trailing}
    </div>
  )
}