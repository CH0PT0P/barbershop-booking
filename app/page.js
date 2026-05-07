import { supabase } from './lib/supabase'

export default async function Home() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .limit(1)

  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Data:', data)
  console.log('Error:', error)

  return (
    <main>
      <h1>Barbershop Booking</h1>
      <p>Supabase status: {error ? 'Error - ' + error.message : 'Connected!'}</p>
    </main>
  )
}