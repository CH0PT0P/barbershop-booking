// AppointmentSheet — bottom drawer that slides up when an appointment block is tapped.
//
// Physics match the BookingDrawer in app/book/page.js exactly:
//   spring: stiffness 400, damping 40, mass 1
//   dismiss threshold: drag offset > 80px down OR velocity > 500px/s
//
// Props:
//   appt            — appointment object (null = sheet is closed)
//   onClose         — called to dismiss without taking action
//   onStatusChange  — called with (id, newStatus) when barber marks complete/cancel/no-show

'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getServiceColor, getServiceDuration, getServicePrice } from '../../../lib/serviceColors'
import { timeStringToMinutes, minutesToTimeString, fmtShort, formatPhone } from '../../../lib/time'
import PrimaryButton from '../primitives/PrimaryButton'
import GhostButton from '../primitives/GhostButton'
import Icon from './Icon'

const SPRING = { type: 'spring', stiffness: 400, damping: 40, mass: 1 }

export default function AppointmentSheet({ appt, onClose, onStatusChange }) {
  const router = useRouter()

  function handleDragEnd(_, info) {
    // Mirror the booking page's dismiss logic: big downward drag or fast flick
    if (info.offset.y > 80 || info.velocity.y > 500) onClose()
  }

  function handleReschedule() {
    onClose()
    const time = minutesToTimeString(timeStringToMinutes(appt.time))
    router.push(`/admin/new?date=${appt.date}&time=${time}`)
  }

  // Compute derived values only when we have an appointment
  const svc      = appt ? getServiceColor(appt.service)    : null
  const duration = appt ? getServiceDuration(appt.service) : 0
  const price    = appt ? getServicePrice(appt.service)    : 0
  const startMin = appt ? timeStringToMinutes(appt.time)   : 0
  const endMin   = startMin + duration
  const phone    = appt?.clients?.phone ?? ''

  return (
    <AnimatePresence>
      {appt && (
        <>
          {/* Scrim — tapping it also closes the sheet */}
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              boxShadow: 'var(--shadow-sheet)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-[10px] pb-[2px]">
              <div
                className="rounded-full"
                style={{ width: 38, height: 5, background: 'rgba(26,26,26,0.18)' }}
              />
            </div>

            {/* Scrollable content (safe on short screens) */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(90dvh - 20px)' }}
            >
              {/* Service chip */}
              <div className="px-6 pt-4">
                <span
                  className={`
                    inline-flex items-center px-3 py-[5px]
                    rounded-full text-[12px] font-bold tracking-[0.1px]
                    ${svc.bgClass} ${svc.textClass}
                  `}
                >
                  {appt.service}
                </span>
              </div>

              {/* Client name + phone */}
              <div className="px-6 pt-[10px]">
                <h2 className="text-[28px] font-bold tracking-[-0.6px] text-body leading-tight">
                  {appt.clients?.name}
                </h2>
                <p className="text-[15px] text-muted mt-[3px] tnum">
                  {formatPhone(phone)}
                </p>
              </div>

              {/* TIME | DURATION | PRICE */}
              <div
                className="
                  mx-6 mt-5 flex
                  rounded-[14px] bg-eggshell-soft
                  border-hairline border-[color:var(--color-hairline)]
                "
              >
                <StatCell label="Time"     value={`${fmtShort(startMin)} · ${fmtShort(endMin)}`} />
                <div className="w-[0.5px] bg-[color:var(--color-hairline)] self-stretch" />
                <StatCell label="Duration" value={`${duration} min`} />
                <div className="w-[0.5px] bg-[color:var(--color-hairline)] self-stretch" />
                <StatCell label="Price"    value={`$${price}`} />
              </div>

              {/* Notes (shown only when present) */}
              {appt.notes && (
                <div className="px-6 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted mb-[6px]">
                    Notes
                  </div>
                  <p className="text-[14px] text-body leading-snug">{appt.notes}</p>
                </div>
              )}

              {/* Message + Call */}
              <div className="px-6 pt-5 flex gap-3">
                <ContactButton
                  href={`sms:${phone}`}
                  icon="message"
                  label="Message"
                />
                <ContactButton
                  href={`tel:${phone}`}
                  icon="phone"
                  label="Call"
                />
              </div>

              {/* Mark complete */}
              <div className="px-6 pt-3">
                <PrimaryButton
                  fullWidth
                  onClick={() => onStatusChange(appt.id, 'completed')}
                >
                  Mark complete · ${price}
                </PrimaryButton>
              </div>

              {/* Reschedule + Cancel */}
              <div
                className="px-6 pt-3 flex gap-3"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}
              >
                <div className="flex-1">
                  <GhostButton fullWidth onClick={handleReschedule}>
                    Reschedule
                  </GhostButton>
                </div>
                <div className="flex-1">
                  <GhostButton
                    fullWidth
                    danger
                    onClick={() => onStatusChange(appt.id, 'cancelled')}
                  >
                    Cancel
                  </GhostButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Three-column stat inside the eggshell row
function StatCell({ label, value }) {
  return (
    <div className="flex-1 px-3 py-[12px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.7px] text-muted">
        {label}
      </div>
      <div className="text-[15px] font-bold text-body tnum mt-[3px] leading-tight">
        {value}
      </div>
    </div>
  )
}

// Icon + label button for Message / Call
function ContactButton({ href, icon, label }) {
  return (
    <a
      href={href}
      className="
        flex-1 flex items-center justify-center gap-[6px]
        py-[13px] rounded-[14px]
        border-hairline border-[color:var(--color-hairline)]
        bg-white text-body
        text-[15px] font-semibold
        active:bg-eggshell-soft transition-colors
        no-underline
      "
    >
      <Icon name={icon} size={17} strokeWidth={2} />
      {label}
    </a>
  )
}
