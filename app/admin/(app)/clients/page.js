'use client'

// Clients — searchable list of all clients with appointment history sheet.
//
// List: alphabetical, Avatar + name + phone + last visit date.
// Sheet: slides up on row tap, shows full appointment history in reverse-chron order.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { formatPhone, formatLongDate, fmtShort, timeStringToMinutes } from '../../../lib/time'
import { getServiceDuration } from '../../../lib/serviceColors'
import ScreenHeader from '../../components/layout/ScreenHeader'
import Avatar from '../../components/primitives/Avatar'
import Icon from '../../components/layout/Icon'

const SPRING = { type: 'spring', stiffness: 400, damping: 40, mass: 1 }

export default function ClientsPage() {
  const [clients, setClients]     = useState([])
  const [query, setQuery]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null) // client object for the sheet

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    // Pull all clients + their booked appointments so we can compute last visit.
    const { data } = await supabase
      .from('clients')
      .select('id, name, phone, appointments(id, date, time, service, status)')
      .order('name', { ascending: true })
    setClients(data || [])
    setLoading(false)
  }

  // Filter by name or phone, case-insensitive.
  const filtered = query.trim().length < 1
    ? clients
    : clients.filter(c => {
        const q = query.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').includes(q)
        )
      })

  return (
    <div className="overflow-y-auto" style={{ height: '100dvh' }}>
      <ScreenHeader eyebrow="MANAGE" title="Clients" />

      {/* Search bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="search" size={16} className="text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="
              w-full pl-9 pr-4 py-[13px]
              bg-eggshell-soft rounded-[14px]
              text-[15px] text-body placeholder:text-muted
              border-hairline border-[color:var(--color-hairline)]
              focus:outline-none
            "
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted active:opacity-60"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        className="px-4 flex flex-col gap-[1px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
      >
        {loading ? (
          <p className="text-muted text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-[14px] text-center py-8">
            {query ? 'No clients match that search.' : 'No clients yet.'}
          </p>
        ) : (
          <div
            className="
              bg-white rounded-[16px] overflow-hidden
              border-hairline border-[color:var(--color-hairline)]
              shadow-card
            "
          >
            {filtered.map((client, i) => {
              const booked = (client.appointments || [])
                .filter(a => a.status === 'booked' || a.status === 'completed')
                .sort((a, b) => (b.date > a.date ? 1 : -1))
              const lastVisit = booked[0]?.date ?? null
              const isLast = i === filtered.length - 1

              return (
                <button
                  key={client.id}
                  onClick={() => setSelected(client)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-[12px] text-left
                    active:bg-eggshell-soft transition-colors
                    ${!isLast ? 'border-b border-[color:var(--color-divider)]' : ''}
                  `}
                >
                  <Avatar name={client.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-body truncate">
                      {client.name}
                    </div>
                    <div className="text-[12px] text-muted tnum mt-[1px]">
                      {formatPhone(client.phone)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {lastVisit ? (
                      <div className="text-[12px] text-muted">{formatLongDate(lastVisit)}</div>
                    ) : (
                      <div className="text-[12px] text-muted italic">No visits</div>
                    )}
                    <div className="text-[11px] text-muted mt-[1px]">
                      {booked.length} {booked.length === 1 ? 'visit' : 'visits'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Client history sheet */}
      <ClientSheet
        client={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

// ─── Client history sheet ────────────────────────────────────────────────────

function ClientSheet({ client, onClose }) {
  function handleDragEnd(_, info) {
    if (info.offset.y > 80 || info.velocity.y > 500) onClose()
  }

  const appts = client
    ? (client.appointments || [])
        .filter(a => a.status === 'booked' || a.status === 'completed')
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.time > a.time ? 1 : -1))
    : []

  return (
    <AnimatePresence>
      {client && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.38)' }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[24px] overflow-hidden"
            style={{
              boxShadow: 'var(--shadow-sheet)',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              maxHeight: '80dvh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-[14px] pb-[10px] flex-shrink-0">
              <div className="w-10 h-[5px] rounded-full bg-hairline" />
            </div>

            {/* Client header */}
            <div className="px-5 pb-4 flex items-center gap-3 flex-shrink-0">
              <Avatar name={client.name} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-[20px] font-bold text-body leading-tight truncate">
                  {client.name}
                </div>
                <div className="text-[13px] text-muted tnum mt-[2px]">
                  {formatPhone(client.phone)}
                </div>
              </div>
              {/* Quick contact */}
              <div className="flex gap-2">
                <a
                  href={`sms:${client.phone}`}
                  className="
                    w-9 h-9 rounded-full bg-eggshell-soft
                    flex items-center justify-center
                    text-pullman active:opacity-60
                  "
                >
                  <Icon name="message" size={16} />
                </a>
                <a
                  href={`tel:${client.phone}`}
                  className="
                    w-9 h-9 rounded-full bg-eggshell-soft
                    flex items-center justify-center
                    text-pullman active:opacity-60
                  "
                >
                  <Icon name="phone" size={16} />
                </a>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '0.5px solid var(--color-divider)' }} className="flex-shrink-0" />

            {/* Appointment history — scrollable */}
            <div className="overflow-y-auto flex-1 px-5 pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-3">
                Visit history · {appts.length} {appts.length === 1 ? 'visit' : 'visits'}
              </div>

              {appts.length === 0 ? (
                <p className="text-muted text-[14px] text-center py-6">No visits yet.</p>
              ) : (
                <div className="flex flex-col gap-[1px]">
                  <div
                    className="
                      bg-eggshell-soft rounded-[14px] overflow-hidden
                      border-hairline border-[color:var(--color-hairline)]
                    "
                  >
                    {appts.map((appt, i) => {
                      const startMin = timeStringToMinutes(appt.time)
                      const duration = getServiceDuration(appt.service)
                      const endMin   = startMin + duration
                      const isLast   = i === appts.length - 1

                      return (
                        <div
                          key={appt.id}
                          className={`
                            px-4 py-[11px] flex items-center gap-3
                            ${!isLast ? 'border-b border-[color:var(--color-divider)]' : ''}
                          `}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-body">
                              {appt.service}
                            </div>
                            <div className="text-[12px] text-muted tnum mt-[1px]">
                              {formatLongDate(appt.date)}
                            </div>
                          </div>
                          <div className="text-[12px] text-muted tnum text-right flex-shrink-0">
                            <div>{fmtShort(startMin)} – {fmtShort(endMin)}</div>
                            <div className={`mt-[1px] text-[11px] ${appt.status === 'completed' ? 'text-green-600' : 'text-muted'}`}>
                              {appt.status === 'completed' ? 'Completed' : 'Upcoming'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
