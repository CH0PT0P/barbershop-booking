import { Instrument_Serif, Caveat } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
})

const caveat = Caveat({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-hand',
})

export const metadata = {
  title: 'Dev The Barber',
  description: 'Premium cuts. Easy booking.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${caveat.variable}`}>
      <body style={{ overscrollBehavior: 'none', position: 'fixed', width: '100%', height: '100%' }}>{children}</body>
    </html>
  )
}