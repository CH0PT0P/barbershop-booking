// Icon — thin wrapper around lucide-react.
//
// Centralizing icons in one place gives us:
//   1) Consistent stroke width across the app (1.7 for inactive, 2 for active)
//   2) A single point to swap icon libraries later if we want to
//   3) Short names that match the design spec ("calendar", "list", etc.)
//
// Usage: <Icon name="calendar" size={24} className="text-pullman" />

import {
  Calendar,
  List,
  Plus,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Pencil,
  Trash2,
  Phone,
  MessageSquare,
  DollarSign,
  Bell,
  Settings,
  Check,
  Ban,
  LogOut,
  Scissors,
  Star,
} from 'lucide-react'

// Map our internal names to lucide components.
const ICONS = {
  calendar: Calendar,
  list: List,
  plus: Plus,
  users: Users,
  clock: Clock,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  search: Search,
  close: X,
  edit: Pencil,
  trash: Trash2,
  phone: Phone,
  message: MessageSquare,
  cash: DollarSign,
  bell: Bell,
  settings: Settings,
  check: Check,
  block: Ban,
  logout: LogOut,
  scissors: Scissors,
  star: Star,
}

export default function Icon({
  name,
  size = 24,
  strokeWidth = 1.7,
  className = '',
}) {
  const LucideIcon = ICONS[name]
  if (!LucideIcon) {
    // Defensive fallback — log a warning but don't crash the page.
    console.warn(`Icon: unknown name "${name}"`)
    return null
  }
  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  )
}