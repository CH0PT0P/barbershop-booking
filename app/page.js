import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: 'url(/landing-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#F1E8D2',
      }}
    >
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
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <img
          src="/landing-hero.svg"
          alt="Dev the Barber"
          style={{ width: '100%', height: 'auto', transform: 'scale(2)', transformOrigin: 'center' }}
        />
      </div>

      {/* Book Now CTA */}
      <div className="px-6 pb-16 pt-4">
        <Link
          href="/book"
          className="flex items-center justify-center w-full py-5 rounded-full text-base font-semibold"
          style={{
            backgroundColor: '#1F1A14',
            color: '#FBF6E8',
          }}
        >
          Book Now &nbsp;→
        </Link>
      </div>

    </main>
  )
}
