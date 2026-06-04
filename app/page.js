import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative h-[100dvh] flex flex-col overflow-hidden">
      {/* Full-screen background — pinned to the viewport so it always
          covers edge to edge, with no gap at the top or bottom */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/landing-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#F1E8D2',
        }}
      />

      {/* Wordmark */}
      <div className="flex justify-center pt-14 pb-2">
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase"
          style={{ color: '#8B8071' }}
        >
          Dev the Barber
        </p>
      </div>

      {/* Hero — logo fills the upper area */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-2">
        <img
          src="/landing-hero.svg"
          alt="Dev the Barber"
          className="w-full h-full object-contain"
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
    </main>
  )
}