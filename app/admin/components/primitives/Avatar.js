// Avatar — circular initials badge.
// Used in client lists, client picker, and the booking summary.
//
// Generates initials from the name automatically:
//   "Dev Moore"     -> "DM"
//   "Hotwife69"     -> "H"
//   "Little Timmy"  -> "LT"
//
// Props:
//   name  — the client's display name
//   size  — pixel size (defaults to 36; the design uses 36 everywhere)

export default function Avatar({ name = '', size = 36 }) {
  // Pull first letter of each space-separated word, max 2 letters.
  const initials = name
    .trim()
    .split(/\s+/)
    .map(word => word[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="
        rounded-full bg-eggshell text-pullman font-bold tracking-tight
        flex items-center justify-center flex-shrink-0
      "
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  )
}