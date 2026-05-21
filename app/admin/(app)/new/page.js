// Next.js requires useSearchParams() to be inside a Suspense boundary.
// This wrapper is the page entry point; the real form lives in NewBookingForm.js.
import { Suspense } from 'react'
import NewBookingForm from './NewBookingForm'

export default function NewBookingPage() {
  return (
    <Suspense>
      <NewBookingForm />
    </Suspense>
  )
}
