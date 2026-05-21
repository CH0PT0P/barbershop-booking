// Layout for all the new admin screens.
//
// Three responsibilities:
//   1) Auth guard — redirect to /admin login if no Supabase session
//   2) Wrap every screen with the bottom TabBar
//   3) Apply the safe-area + scroll structure for mobile
//
// Anything under app/admin/(app)/ inherits this layout. The parentheses
// in the folder name mean "share this layout but don't add to the URL."
// So app/admin/(app)/day/page.js lives at /admin/day (not /admin/app/day).

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import TabBar from '../components/layout/TabBar'

export default function AdminAppLayout({ children }) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/admin')
        return
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  // Block rendering until we've confirmed the user is logged in. This prevents
  // a flash of admin content if someone hits /admin/day without a session.
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Scrollable content area. The padding-bottom leaves room for the
          tab bar so content isn't hidden behind it. */}
      <main
        className="min-h-screen"
        style={{
          // Reserve space for the tab bar (about 90px including safe-area).
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)',
        }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  )
}