import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col"
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

      {/* Hero area — fills ~two-thirds of the screen */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">

        {/* Placeholder — delete this div when public/landing-hero.png exists */}
        <div
          className="w-full max-w-xs flex items-center justify-center rounded-2xl"
          style={{
            aspectRatio: '1 / 1',
            border: '2px dashed #8B8071',
            color: '#8B8071',
          }}
        >
          <span className="text-sm">Hero art goes here</span>
        </div>

        {/* When public/landing-hero.png exists, delete the div above and uncomment: */}
        {/* <img src="/landing-hero.png" alt="" className="w-full max-w-xs" /> */}

      </div>

      {/* Book Now CTA — sits near the two-thirds line */}
      <div className="px-8 pb-20 pt-6 flex justify-center">
        <Link
          href="/book"
          className="px-14 py-4 rounded-full text-base font-semibold"
          style={{
            backgroundColor: '#1F1A14',
            color: '#FBF6E8',
          }}
        >
          Book Now
        </Link>
      </div>

    </main>
  )
}
