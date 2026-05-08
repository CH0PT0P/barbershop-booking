'use client'
import { useRouter } from 'next/navigation'

const services = [
  {
    name: "Men's Cut",
    price: 35,
    emoji: '✂️',
    description: 'A bespoke cut tailored to you. Because no two clients are the same.',
  },
  {
    name: 'Kids Cut',
    price: 25,
    emoji: '✂️',
    description: 'Tots to teens (14 & under) — give them the confidence to tackle life.',
  },
  {
    name: 'Beard Trim',
    price: 15,
    emoji: '🧔',
    description: 'Shaped, lined, and looking sharp.',
  },
  {
    name: 'Mullet Trim',
    price: 15,
    emoji: '🤙',
    description: 'Business in the front, party in the back. A cleanup of the sides and neckline — not a full cut.',
  },
]

export default function BookPage() {
  const router = useRouter()

  function selectService(service) {
    localStorage.setItem('selectedService', JSON.stringify(service))
    router.push('/book/date')
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Book Your Cut</h1>
      <p className="text-gray-400 text-center mb-10">Select a service to get started</p>

      <div className="max-w-md mx-auto flex flex-col gap-4">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => selectService(service)}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-left hover:border-white transition"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-semibold">{service.emoji} {service.name}</span>
              <span className="text-white font-bold">${service.price}</span>
            </div>
            <p className="text-gray-400 text-sm">{service.description}</p>
          </button>
        ))}
      </div>
    </main>
  )
}