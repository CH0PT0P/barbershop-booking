import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
      
      {/* Top section — fills most of the screen */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">
        
        {/* Scissors icon with red glow */}
        <div 
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
          style={{ 
            backgroundColor: '#DC343B',
            boxShadow: '0 0 60px rgba(220, 52, 59, 0.4)'
          }}
        >
          <span className="text-4xl">✂️</span>
        </div>

        {/* Name */}
        <h1 
          className="text-5xl font-bold text-center mb-2 tracking-tight"
          style={{ color: '#FFFFFF' }}
        >
          Dev The Barber
        </h1>

        {/* Tagline */}
        <p 
          className="text-center text-lg mb-16"
          style={{ color: '#888888' }}
        >
          Premium cuts. Easy booking.
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mb-16">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>800+</p>
            <p className="text-xs" style={{ color: '#888888' }}>Happy clients</p>
          </div>
          <div className="w-px" style={{ backgroundColor: '#333333' }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>5★</p>
            <p className="text-xs" style={{ color: '#888888' }}>Rated</p>
          </div>
          <div className="w-px" style={{ backgroundColor: '#333333' }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>4</p>
            <p className="text-xs" style={{ color: '#888888' }}>Services</p>
          </div>
        </div>

        {/* Service pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-16">
          {["Men's Cut", "Kids Cut", "Beard Trim", "Mullet Trim"].map(s => (
            <span 
              key={s}
              className="px-4 py-2 rounded-full text-sm"
              style={{ backgroundColor: '#1A1A1A', color: '#888888', border: '1px solid #2A2A2A' }}
            >
              {s}
            </span>
          ))}
        </div>

      </div>

      {/* Bottom CTA — pinned to bottom */}
      <div className="px-6 pb-12 pt-4" style={{ borderTop: '1px solid #1A1A1A' }}>
        <Link
          href="/book"
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold text-center transition active:opacity-90 flex items-center justify-center"
          style={{ backgroundColor: '#DC343B' }}
        >
          Book Your Cut →
        </Link>
        <p className="text-center text-xs mt-4" style={{ color: '#444444' }}>
          devthebarber.com
        </p>
      </div>

    </main>
  )
}