// TabBar — the persistent bottom navigation across all admin screens.
// 5 tabs: Today, Upcoming, Book (floating primary action), Clients, Hours.
//
// The active tab is determined from the current URL using Next.js's
// usePathname hook. This means every tab automatically updates its
// active state when the user navigates — we don't pass anything in.

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from './Icon'

const TABS = [
  { id: 'day',      label: 'Today',    icon: 'calendar', href: '/admin/day' },
  { id: 'upcoming', label: 'Upcoming', icon: 'list',     href: '/admin/upcoming' },
  { id: 'new',      label: 'Book',     icon: 'plus',     href: '/admin/new', primary: true },
  { id: 'clients',  label: 'Clients',  icon: 'users',    href: '/admin/clients' },
  { id: 'hours',    label: 'Hours',    icon: 'clock',    href: '/admin/hours' },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-30
        bg-white/90 backdrop-blur-[24px] backdrop-saturate-[160%]
        border-t border-hairline border-[color:var(--color-hairline)]
        flex justify-around items-start
        pt-2
      "
      style={{
        // iOS safe area: respects the home indicator on iPhones with
        // notches/dynamic islands; falls back to 32px on devices without it.
        paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
      }}
    >
      {TABS.map(tab => {
        // A tab is active if the current URL starts with its href.
        // Using startsWith means /admin/day/anything keeps Today highlighted.
        const isActive = pathname.startsWith(tab.href)
        return <TabButton key={tab.id} tab={tab} isActive={isActive} />
      })}
    </nav>
  )
}

function TabButton({ tab, isActive }) {
  // The Book button is special: floating brown square that sits above the bar.
  if (tab.primary) {
    return (
      <Link
        href={tab.href}
        className="
          flex flex-col items-center gap-1 px-2 min-w-[56px]
          no-underline
        "
      >
        <div
          className="
            w-11 h-11 rounded-[14px] bg-pullman text-white
            flex items-center justify-center
            shadow-floating
            -mt-[10px]
            active:scale-95 transition-transform
          "
        >
          <Icon name="plus" size={26} strokeWidth={2} />
        </div>
        <div className="text-[10px] font-semibold text-pullman tracking-[0.1px]">
          {tab.label}
        </div>
      </Link>
    )
  }

  // Regular tab: icon + label, stacked.
  const color = isActive ? 'text-pullman' : 'text-silver'
  return (
    <Link
      href={tab.href}
      className="
        flex flex-col items-center gap-[3px] px-2 py-1 min-w-[56px]
        no-underline
      "
    >
      <Icon
        name={tab.icon}
        size={24}
        strokeWidth={isActive ? 2 : 1.7}
        className={color}
      />
      <div
        className={`
          text-[10px] tracking-[0.1px] ${color}
          ${isActive ? 'font-bold' : 'font-medium'}
        `}
      >
        {tab.label}
      </div>
    </Link>
  )
}