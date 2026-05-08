import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">✂️ The Chair</h1>
      <p className="text-gray-400 text-lg mb-8 text-center">Premium cuts. Easy booking.</p>
      <Link
        href="/book"
        className="bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-200 transition"
      >
        Book Your Cut
      </Link>
    </main>
  )
}