import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative h-[100dvh] overflow-hidden">
      {/* Full-screen background — pinned to the viewport, sits BEHIND the
          content (z-0) but in front of the page itself, so it covers
          edge to edge with no gaps. */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/landing-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#F1E8D2',
        }}
      />

      {/* Content layer — sits above the background (z-10) */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Wordmark */}
        <div className="flex justify-center pt-14 pb-2">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: '#8B8071' }}
          >
            Dev the Barber
          </p>
        </div>

        {/* Hero — the scale() number controls the size.
            Bigger number = bigger logo. Currently doubled (2). */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-6">
          <img
            src="/landing-hero.svg"
            alt="Dev the Barber"
            className="w-full h-full object-contain"
            style={{ transform: 'scale(2)' }}
          />
        </div>

        {/* Book Now CTA */}
        <div className="px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+3.5rem)]">
          <Link
            href="/book"
            className="flex items-center justify-center gap-2 w-full py-5 rounded-full text-base font-semibold shadow-[0_12px_28px_rgba(31,26,20,0.26)]"
            style={{
              backgroundColor: '#1F1A14',
              color: '#FBF6E8',
            }}
          >
            Book Now
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}