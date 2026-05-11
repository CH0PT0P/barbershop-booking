'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dayview')
  const [clients, setClients] = useState([])
  const [clientPage, setClientPage] = useState(0)
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [availability, setAvailability] = useState([])
  const [overrides, setOverrides] = useState([])
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideStart, setOverrideStart] = useState('')
  const [overrideEnd, setOverrideEnd] = useState('')
  const [overrideBlocked, setOverrideBlocked] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [expandedClient, setExpandedClient] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesValue, setNotesValue] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewAllClient, setViewAllClient] = useState(null)
  const sentinelRef = useRef(null)
  const PAGE_SIZE = 20

  // New booking state
  const [bookingStep, setBookingStep] = useState('search')
  const [bookingClientSearch, setBookingClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [bookDate, setBookDate] = useState('')
  const [bookTime, setBookTime] = useState('')
  const [bookCalMonth, setBookCalMonth] = useState(new Date())
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  // Book Next state
  const [showBookNext, setShowBookNext] = useState(false)
  const [bookNextDate, setBookNextDate] = useState('')
  const [bookNextTime, setBookNextTime] = useState('')
  const [bookNextCalMonth, setBookNextCalMonth] = useState(new Date())

  useEffect(() => {
    checkAuth()
    fetchAppointments()
    fetchInitialClients()
    fetchAvailability()
    fetchOverrides()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreClients && !clientsLoading && !isSearching) {
          loadMoreClients()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMoreClients, clientsLoading, isSearching, clientPage])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin')
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`*, clients (name, phone)`)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (error) console.error(error)
    else setAppointments(data)
    setLoading(false)
  }

  async function fetchInitialClients() {
    setClientsLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select(`*, appointments (id, date, time, service, status, notes)`)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)
    if (error) console.error(error)
    else {
      setClients(data)
      setHasMoreClients(data.length === PAGE_SIZE)
      setClientPage(1)
    }
    setClientsLoading(false)
  }

  async function loadMoreClients() {
    if (clientsLoading || !hasMoreClients) return
    setClientsLoading(true)
    const from = clientPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('clients')
      .select(`*, appointments (id, date, time, service, status, notes)`)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) console.error(error)
    else {
      setClients(prev => [...prev, ...data])
      setHasMoreClients(data.length === PAGE_SIZE)
      setClientPage(prev => prev + 1)
    }
    setClientsLoading(false)
  }

  async function searchClients(query) {
    if (!query.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const { data, error } = await supabase
      .from('clients')
      .select(`*, appointments (id, date, time, service, status, notes)`)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error(error)
    else setSearchResults(data)
  }

  async function fetchAvailability() {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .order('day_of_week', { ascending: true })
    if (error) console.error(error)
    else setAvailability(data)
  }

  async function fetchOverrides() {
    const { data, error } = await supabase
      .from('date_overrides')
      .select('*')
      .order('date', { ascending: true })
    if (error) console.error(error)
    else setOverrides(data)
  }

  async function updateAvailability(id, updates) {
    const { error } = await supabase
      .from('availability')
      .update(updates)
      .eq('id', id)
    if (!error) fetchAvailability()
  }

  async function addOverride() {
    if (!overrideDate) return
    const { error } = await supabase
      .from('date_overrides')
      .upsert({
        date: overrideDate,
        start_time: overrideBlocked ? null : overrideStart,
        end_time: overrideBlocked ? null : overrideEnd,
        is_blocked: overrideBlocked
      })
    if (!error) {
      fetchOverrides()
      setOverrideDate('')
      setOverrideStart('')
      setOverrideEnd('')
      setOverrideBlocked(false)
    }
  }

  async function deleteOverride(id) {
    const { error } = await supabase
      .from('date_overrides')
      .delete()
      .eq('id', id)
    if (!error) fetchOverrides()
  }

  async function updateAppointmentStatus(id, status, clientName) {
    const messages = {
      cancelled: `Cancel ${clientName}'s appointment? This cannot be undone.`,
      no_show: `Mark ${clientName} as a no-show?`,
      completed: `Mark ${clientName}'s appointment as complete?`
    }
    const confirmed = window.confirm(messages[status])
    if (!confirmed) return
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
    if (!error) {
      fetchAppointments()
      fetchInitialClients()
      setSelectedAppt(null)
      setShowBookNext(false)
    }
  }

  async function saveClientNotes(clientId) {
    const { error } = await supabase
      .from('clients')
      .update({ notes: notesValue })
      .eq('id', clientId)
    if (!error) {
      fetchInitialClients()
      setEditingNotes(null)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  async function createBooking(clientId, service, date, time) {
    const { error } = await supabase
      .from('appointments')
      .insert({
        client_id: clientId,
        date: date,
        time: time + ':00',
        service: service,
        status: 'booked'
      })
    return error
  }

  async function getOrCreateClient(name, phone) {
    const digits = phone.replace(/\D/g, '')
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', digits)
      .single()
    if (existing) return { id: existing.id, error: null }
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({ name, phone: digits })
      .select('id')
      .single()
    return { id: newClient?.id, error }
  }

  async function confirmNewBooking() {
    setBookingError('')
    if (!bookDate || !bookTime || !selectedService) {
      setBookingError('Please fill in all fields.')
      return
    }
    let clientId
    if (selectedClient) {
      clientId = selectedClient.id
    } else {
      if (!newClientName || !newClientPhone) {
        setBookingError('Please enter client name and phone.')
        return
      }
      const { id, error } = await getOrCreateClient(newClientName, newClientPhone)
      if (error) { setBookingError('Error saving client.'); return }
      clientId = id
    }
    const error = await createBooking(clientId, selectedService, bookDate, bookTime)
    if (error) { setBookingError('Error creating appointment.'); return }
    fetchAppointments()
    fetchInitialClients()
    setBookingSuccess(true)
  }

  async function confirmBookNext() {
    if (!bookNextDate || !bookNextTime || !selectedAppt) return
    const error = await createBooking(
      selectedAppt.client_id,
      selectedAppt.service,
      bookNextDate,
      bookNextTime
    )
    if (!error) {
      fetchAppointments()
      setShowBookNext(false)
      setBookNextDate('')
      setBookNextTime('')
      setSelectedAppt(null)
    }
  }

  function resetNewBooking() {
    setBookingStep('search')
    setBookingClientSearch('')
    setSelectedClient(null)
    setNewClientName('')
    setNewClientPhone('')
    setSelectedService('')
    setBookDate('')
    setBookTime('')
    setBookingSuccess(false)
    setBookingError('')
    setBookCalMonth(new Date())
  }

  function formatTime(time) {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function formatPhone(phone) {
    const d = phone.replace(/\D/g, '')
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    return phone
  }

  function getServiceDuration(service) {
    if (service === "Men's Cut") return 40
    if (service === 'Kids Cut') return 30
    if (service === 'Beard Trim') return 15
    if (service === 'Mullet Trim') return 15
    return 30
  }

  function getServiceColor(service) {
    if (service === "Men's Cut") return 'bg-blue-600 border-blue-400'
    if (service === 'Kids Cut') return 'bg-purple-600 border-purple-400'
    if (service === 'Beard Trim') return 'bg-emerald-600 border-emerald-400'
    if (service === 'Mullet Trim') return 'bg-orange-600 border-orange-400'
    return 'bg-zinc-600 border-zinc-400'
  }

  function getStatusTag(status) {
    if (status === 'completed') return { label: 'Completed', color: 'text-green-400' }
    if (status === 'cancelled') return { label: 'Cancelled', color: 'text-red-400' }
    if (status === 'no_show') return { label: 'No Show', color: 'text-yellow-400' }
    return { label: 'Booked', color: 'text-blue-400' }
  }

  function generateTimeSlots() {
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  function renderCalendar(selectedDate, setSelectedDate, calMonthState, setCalMonthState) {
    const year = calMonthState.getFullYear()
    const month = calMonthState.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayObj = new Date()
    todayObj.setHours(0,0,0,0)
    return (
      <div className="bg-zinc-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => { const d = new Date(calMonthState); d.setMonth(d.getMonth() - 1); setCalMonthState(d) }} className="text-gray-400 hover:text-white text-xl px-2">‹</button>
          <span className="font-semibold text-sm">{monthNames[month]} {year}</span>
          <button onClick={() => { const d = new Date(calMonthState); d.setMonth(d.getMonth() + 1); setCalMonthState(d) }} className="text-gray-400 hover:text-white text-xl px-2">›</button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
            const dateObj = new Date(year, month, i + 1)
            const isPast = dateObj <= todayObj
            const isSelected = selectedDate === dateStr
            return (
              <button key={i} onClick={() => !isPast && setSelectedDate(dateStr)} disabled={isPast}
                className={`rounded-lg py-2 text-sm font-medium transition ${isSelected ? 'bg-white text-black' : isPast ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-zinc-600 text-white'}`}>
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function renderTimeSlots(selectedTime, setSelectedTime, bookedTimes = []) {
    const slots = generateTimeSlots()
    return (
      <div className="grid grid-cols-4 gap-2">
        {slots.map(slot => {
          const isBooked = bookedTimes.includes(slot + ':00')
          const isSelected = selectedTime === slot
          return (
            <button key={slot} onClick={() => !isBooked && setSelectedTime(slot)} disabled={isBooked}
              className={`rounded-xl py-2 text-xs font-medium transition border ${isSelected ? 'bg-white text-black border-white' : isBooked ? 'border-zinc-800 text-zinc-700 cursor-not-allowed' : 'border-zinc-600 hover:border-white text-white'}`}>
              {isBooked ? '—' : formatTime(slot)}
            </button>
          )
        })}
      </div>
    )
  }

  function renderClientCard(client) {
    const allAppts = client.appointments || []
    const completed = allAppts.filter(a => a.status === 'completed')
    const upcoming = allAppts.filter(a => a.status === 'booked').sort((a,b) => a.date > b.date ? 1 : -1)
    const history = allAppts.filter(a => ['completed','cancelled','no_show'].includes(a.status)).sort((a,b) => a.date > b.date ? -1 : 1)
    const recentHistory = history.slice(0, 2)
    const lastVisit = completed.length > 0 ? completed.sort((a,b) => a.date > b.date ? -1 : 1)[0].date : null
    const firstVisit = completed.length > 0 ? completed.sort((a,b) => a.date > b.date ? 1 : -1)[0].date : null
    const isExpanded = expandedClient === client.id
    const isEditingNotes = editingNotes === client.id
    const isViewAll = viewAllClient === client.id

    return (
      <div key={client.id} className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">

        {/* Slim header — always visible */}
        <button className="w-full px-5 py-4 text-left flex justify-between items-center"
          onClick={() => setExpandedClient(isExpanded ? null : client.id)}>
          <div>
            <p className="font-semibold">{client.name}</p>
            <p className="text-gray-400 text-sm">{formatPhone(client.phone)}</p>
          </div>
          <span className="text-gray-600 text-sm">{isExpanded ? '↑' : '↓'}</span>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-zinc-700 pt-4 flex flex-col gap-4">

            {/* Stats row */}
            <div className="flex gap-0">
              <div className="flex-1 border-r border-zinc-700 pr-4">
                <p className="text-gray-400 text-xs mb-1">Visits</p>
                <p className="text-2xl font-bold">{completed.length}</p>
              </div>
              <div className="flex-1 border-r border-zinc-700 px-4">
                <p className="text-gray-400 text-xs mb-1">Last Visit</p>
                <p className="text-xl font-bold">{lastVisit ? new Date(lastVisit + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
              </div>
              <div className="flex-1 pl-4">
                <p className="text-gray-400 text-xs mb-1">First Visit</p>
                <p className="text-xl font-bold">{firstVisit ? new Date(firstVisit + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-400 text-xs">Notes</p>
                {!isEditingNotes && (
                  <button onClick={() => { setEditingNotes(client.id); setNotesValue(client.notes || '') }}
                    className="text-xs text-gray-500 hover:text-white transition">
                    {client.notes ? 'Edit' : '+ Add'}
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="flex flex-col gap-2">
                  <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Notes about this client..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveClientNotes(client.id)}
                      className="flex-1 bg-white text-black py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition">Save</button>
                    <button onClick={() => setEditingNotes(null)}
                      className="flex-1 bg-zinc-800 text-gray-400 py-2 rounded-full text-sm hover:text-white transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{client.notes || <span className="text-zinc-600">No notes yet</span>}</p>
              )}
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-2">Upcoming</p>
                <div className="flex flex-col gap-2">
                  {upcoming.map(appt => (
                    <div key={appt.id} className="flex justify-between items-center bg-zinc-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{appt.service}</p>
                        <p className="text-xs text-gray-400">{formatDate(appt.date)} at {formatTime(appt.time)}</p>
                      </div>
                      <span className="text-xs text-blue-400">Booked</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visit history */}
            {history.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-2">Recent Visits</p>
                <div className="flex flex-col gap-2">
                  {(isViewAll ? history : recentHistory).map(appt => {
                    const tag = getStatusTag(appt.status)
                    return (
                      <div key={appt.id} className="flex justify-between items-center bg-zinc-800 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{appt.service}</p>
                          <p className="text-xs text-gray-400">{formatDate(appt.date)}</p>
                        </div>
                        <span className={`text-xs ${tag.color}`}>{tag.label}</span>
                      </div>
                    )
                  })}
                </div>
                {history.length > 2 && (
                  <button onClick={() => setViewAllClient(isViewAll ? null : client.id)}
                    className="text-xs text-gray-500 hover:text-white transition mt-2">
                    {isViewAll ? 'Show less ↑' : `View all ${history.length} visits →`}
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  const services = ["Men's Cut", 'Kids Cut', 'Beard Trim', 'Mullet Trim']
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayAppts = appointments.filter(a => a.date === today && a.status === 'booked')
  const upcomingAppts = appointments.filter(a => a.date > today && a.status === 'booked')
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const calYear = calMonth.getFullYear()
  const calMonthIndex = calMonth.getMonth()
  const firstDay = new Date(calYear, calMonthIndex, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate()

  const viewDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`
  const dayAppts = appointments.filter(a => a.date === viewDateStr && a.status === 'booked')
  const DAY_START = 11
  const DAY_END = 18
  const TOTAL_MINUTES = (DAY_END - DAY_START) * 60
  const TIMELINE_HEIGHT = 600

  function timeToMinutes(timeStr) {
    const parts = timeStr.split(':').map(Number)
    return parts[0] * 60 + parts[1]
  }

  function getTopPercent(timeStr) {
    const minutes = timeToMinutes(timeStr)
    const offset = minutes - (DAY_START * 60)
    return (offset / TOTAL_MINUTES) * 100
  }

  function getHeightPercent(duration) {
    return (duration / TOTAL_MINUTES) * 100
  }

  function changeDay(delta) {
    const d = new Date(viewDate)
    d.setDate(d.getDate() + delta)
    setViewDate(d)
  }

  const isToday = viewDateStr === today
  const bookedTimesForDate = appointments.filter(a => a.date === bookDate && a.status === 'booked').map(a => a.time)
  const bookedTimesForNextDate = appointments.filter(a => a.date === bookNextDate && a.status === 'booked').map(a => a.time)

  const bookingSearchResults = bookingClientSearch.length > 1
    ? clients.filter(c =>
        c.name.toLowerCase().includes(bookingClientSearch.toLowerCase()) ||
        c.phone.includes(bookingClientSearch)
      ).slice(0, 5)
    : []

  const displayedClients = isSearching ? searchResults : clients

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dev The Barber</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">Log Out</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Today</p>
            <p className="text-3xl font-bold">{todayAppts.length}</p>
            <p className="text-gray-400 text-sm">appointments</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold">{upcomingAppts.length}</p>
            <p className="text-gray-400 text-sm">appointments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['dayview', 'upcoming', 'new booking', 'clients', 'availability'].map((tab) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'new booking') resetNewBooking() }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 hover:text-white'}`}>
              {tab === 'dayview' ? 'Day View' : tab === 'availability' ? 'Schedule' : tab === 'new booking' ? 'New Booking' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Day View */}
        {activeTab === 'dayview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => changeDay(-1)} className="text-gray-400 hover:text-white text-2xl px-2">‹</button>
              <div className="text-center">
                <p className="font-semibold text-lg">{viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                {isToday && <p className="text-xs text-blue-400">Today</p>}
              </div>
              <button onClick={() => changeDay(1)} className="text-gray-400 hover:text-white text-2xl px-2">›</button>
            </div>
            <div className="relative flex" style={{ height: `${TIMELINE_HEIGHT}px` }}>
              <div className="w-16 flex-shrink-0 relative">
                {Array.from({ length: DAY_END - DAY_START + 1 }).map((_, i) => {
                  const hour = DAY_START + i
                  const topPercent = (i / (DAY_END - DAY_START)) * 100
                  const label = hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`
                  return (
                    <div key={hour} className="absolute text-xs text-gray-500" style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}>{label}</div>
                  )
                })}
              </div>
              <div className="flex-1 relative border-l border-zinc-800">
                {Array.from({ length: DAY_END - DAY_START + 1 }).map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-zinc-800" style={{ top: `${(i / (DAY_END - DAY_START)) * 100}%` }} />
                ))}
                {dayAppts.map((appt) => {
                  const duration = getServiceDuration(appt.service)
                  const top = getTopPercent(appt.time.slice(0, 5))
                  const height = getHeightPercent(duration)
                  const colorClass = getServiceColor(appt.service)
                  return (
                    <button key={appt.id}
                      onClick={() => { setSelectedAppt(appt); setShowBookNext(false) }}
                      className={`absolute left-2 right-2 rounded-xl border-l-4 px-3 py-2 text-left transition hover:opacity-90 ${colorClass}`}
                      style={{ top: `${top}%`, height: `${height}%`, minHeight: '36px' }}>
                      <p className="text-white text-sm font-semibold truncate">{appt.clients?.name} {appt.notes ? '📝' : ''}</p>
                      {height > 8 && <p className="text-white/70 text-xs truncate">{appt.service}</p>}
                    </button>
                  )
                })}
                {dayAppts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-600 text-sm">No appointments</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { service: "Men's Cut", color: 'bg-blue-600' },
                { service: 'Kids Cut', color: 'bg-purple-600' },
                { service: 'Beard Trim', color: 'bg-emerald-600' },
                { service: 'Mullet Trim', color: 'bg-orange-600' },
              ].map(({ service, color }) => (
                <div key={service} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-gray-400">{service}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {activeTab === 'upcoming' && (
          <>
            {loading ? <p className="text-gray-400">Loading...</p> : upcomingAppts.length === 0 ? (
              <p className="text-gray-400">No upcoming appointments.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{appt.clients?.name}</p>
                        <p className="text-gray-400 text-sm">{appt.service}</p>
                        <p className="text-gray-400 text-sm">{new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {formatTime(appt.time)}</p>
                        <p className="text-gray-400 text-sm">{appt.clients?.phone}</p>
                      </div>
                      <button onClick={() => updateAppointmentStatus(appt.id, 'cancelled', appt.clients?.name)} className="text-red-400 hover:text-red-300 text-sm transition">Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* New Booking */}
        {activeTab === 'new booking' && (
          <div>
            {bookingSuccess ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-2">Booked!</h2>
                <p className="text-gray-400 mb-8">Appointment has been added.</p>
                <button onClick={resetNewBooking} className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition">Book Another</button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Find Client</h2>
                  <input type="text" placeholder="Search by name or phone..."
                    value={bookingClientSearch}
                    onChange={(e) => { setBookingClientSearch(e.target.value); setBookingStep('search'); setSelectedClient(null) }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition mb-3"
                  />
                  {bookingSearchResults.length > 0 && !selectedClient && (
                    <div className="flex flex-col gap-2 mb-3">
                      {bookingSearchResults.map(client => (
                        <button key={client.id} onClick={() => { setSelectedClient(client); setBookingClientSearch(client.name) }}
                          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-left hover:border-white transition">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-gray-400 text-sm">{client.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="bg-zinc-900 border border-white rounded-xl px-4 py-3 mb-3">
                      <p className="font-medium">✓ {selectedClient.name}</p>
                      <p className="text-gray-400 text-sm">{selectedClient.phone}</p>
                    </div>
                  )}
                  <button onClick={() => setBookingStep('newclient')} className="text-sm text-gray-400 hover:text-white transition">+ New client</button>
                  {bookingStep === 'newclient' && (
                    <div className="flex flex-col gap-3 mt-3">
                      <input type="text" placeholder="Full name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition" />
                      <input type="tel" placeholder="Phone number" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Service</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {services.map(s => (
                      <button key={s} onClick={() => setSelectedService(s)}
                        className={`rounded-xl py-3 px-4 text-sm font-medium transition border ${selectedService === s ? 'bg-white text-black border-white' : 'border-zinc-700 hover:border-white text-white'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Date</h2>
                  {renderCalendar(bookDate, setBookDate, bookCalMonth, setBookCalMonth)}
                </div>
                {bookDate && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Time</h2>
                    {renderTimeSlots(bookTime, setBookTime, bookedTimesForDate)}
                  </div>
                )}
                {bookingError && <p className="text-red-400 text-sm">{bookingError}</p>}
                <button onClick={confirmNewBooking} disabled={!bookDate || !bookTime || !selectedService}
                  className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg disabled:opacity-30 hover:bg-gray-200 transition">
                  Confirm Booking
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clients */}
        {activeTab === 'clients' && (
          <div>
            <input type="text" placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => { setClientSearch(e.target.value); searchClients(e.target.value) }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition mb-6"
            />
            <div className="flex flex-col gap-3">
              {displayedClients.map(client => renderClientCard(client))}
              {/* Infinite scroll sentinel */}
              {!isSearching && (
                <div ref={sentinelRef} className="py-4 text-center">
                  {clientsLoading && <p className="text-gray-500 text-sm">Loading more...</p>}
                  {!hasMoreClients && clients.length > 0 && <p className="text-gray-600 text-xs">All clients loaded</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'availability' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Repeating Schedule</h2>
              <div className="flex flex-col gap-3">
                {availability.map((day) => (
                  <div key={day.id} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dayNames[day.day_of_week]}</span>
                      <button onClick={() => updateAvailability(day.id, { is_blocked: !day.is_blocked })}
                        className={`text-xs px-3 py-1 rounded-full transition ${day.is_blocked ? 'bg-zinc-700 text-gray-400' : 'bg-green-900 text-green-400'}`}>
                        {day.is_blocked ? 'Closed' : 'Open'}
                      </button>
                    </div>
                    {!day.is_blocked && (
                      <div className="flex gap-3 mt-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-gray-400">Open</label>
                          <input type="time" defaultValue={day.start_time?.slice(0, 5)}
                            onBlur={(e) => updateAvailability(day.id, { start_time: e.target.value })}
                            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-gray-400">Close</label>
                          <input type="time" defaultValue={day.end_time?.slice(0, 5)}
                            onBlur={(e) => updateAvailability(day.id, { end_time: e.target.value })}
                            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Make a One-Time Change</h2>
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-4">
                <p className="text-sm text-gray-400 mb-4">Block a day or set custom hours for a specific date</p>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d) }} className="text-gray-400 hover:text-white text-xl px-2">‹</button>
                  <span className="font-semibold">{monthNames[calMonthIndex]} {calYear}</span>
                  <button onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d) }} className="text-gray-400 hover:text-white text-xl px-2">›</button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dateStr = `${calYear}-${String(calMonthIndex + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                    const isSelected = overrideDate === dateStr
                    const hasOverride = overrides.find(o => o.date === dateStr)
                    return (
                      <button key={i} onClick={() => setOverrideDate(dateStr)}
                        className={`rounded-lg py-2 text-sm font-medium transition relative ${isSelected ? 'bg-white text-black' : hasOverride ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-700 text-white'}`}>
                        {i + 1}
                        {hasOverride && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400 block" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {overrideDate && (
                  <div className="flex flex-col gap-3 border-t border-zinc-700 pt-4">
                    <p className="text-sm font-medium">{new Date(overrideDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input type="checkbox" checked={overrideBlocked} onChange={(e) => setOverrideBlocked(e.target.checked)} />
                      Block this day off completely
                    </label>
                    {!overrideBlocked && (
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-gray-400">Open</label>
                          <input type="time" value={overrideStart} onChange={(e) => setOverrideStart(e.target.value)} className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-gray-400">Close</label>
                          <input type="time" value={overrideEnd} onChange={(e) => setOverrideEnd(e.target.value)} className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white" />
                        </div>
                      </div>
                    )}
                    <button onClick={addOverride} className="w-full bg-white text-black py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition">Save Change</button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {overrides.length === 0 ? (
                  <p className="text-gray-400 text-sm">No one-time changes set.</p>
                ) : (
                  overrides.map((o) => (
                    <div key={o.id} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{new Date(o.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-400">{o.is_blocked ? 'Blocked off' : `${o.start_time?.slice(0, 5)} – ${o.end_time?.slice(0, 5)}`}</p>
                      </div>
                      <button onClick={() => deleteOverride(o.id)} className="text-red-400 hover:text-red-300 text-sm transition">Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Appointment detail popup */}
      {selectedAppt && !showBookNext && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}} onClick={() => setSelectedAppt(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl w-full p-6 pb-10 min-h-[67vh] max-h-[80vh] overflow-y-auto" style={{position: 'relative', zIndex: 9999}} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-6" />
            <div className={`w-3 h-3 rounded-full ${getServiceColor(selectedAppt.service).split(' ')[0]} mb-4`} />
            <h2 className="text-2xl font-bold mb-1">{selectedAppt.clients?.name}</h2>
            <p className="text-gray-400 mb-6">{selectedAppt.clients?.phone}</p>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Service</span>
                <span className="font-medium">{selectedAppt.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="font-medium">{new Date(selectedAppt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time</span>
                <span className="font-medium">{formatTime(selectedAppt.time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="font-medium">{getServiceDuration(selectedAppt.service)} min</span>
              </div>
              {selectedAppt.notes && (
                <div className="flex flex-col gap-1 border-t border-zinc-700 pt-3">
                  <span className="text-gray-400">Notes</span>
                  <span className="font-medium text-sm">{selectedAppt.notes}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowBookNext(true)} className="w-full bg-white text-black py-3 rounded-full font-semibold transition hover:bg-gray-200">Book Next Appointment</button>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updateAppointmentStatus(selectedAppt.id, 'cancelled', selectedAppt.clients?.name)} className="bg-zinc-800 hover:bg-zinc-700 text-red-400 py-3 rounded-full text-sm font-semibold transition">Cancel</button>
                <button onClick={() => updateAppointmentStatus(selectedAppt.id, 'no_show', selectedAppt.clients?.name)} className="bg-zinc-800 hover:bg-zinc-700 text-yellow-400 py-3 rounded-full text-sm font-semibold transition">No Show</button>
                <button onClick={() => updateAppointmentStatus(selectedAppt.id, 'completed', selectedAppt.clients?.name)} className="bg-zinc-800 hover:bg-zinc-700 text-green-400 py-3 rounded-full text-sm font-semibold transition">Complete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Next popup */}
      {selectedAppt && showBookNext && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50" onClick={() => setShowBookNext(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-1">Book Next for {selectedAppt.clients?.name}</h2>
            <p className="text-gray-400 text-sm mb-6">{selectedAppt.service} — same service</p>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Pick a Date</h3>
            {renderCalendar(bookNextDate, setBookNextDate, bookNextCalMonth, setBookNextCalMonth)}
            {bookNextDate && (
              <>
                <h3 className="text-sm font-semibold text-gray-400 mt-6 mb-3">Pick a Time</h3>
                {renderTimeSlots(bookNextTime, setBookNextTime, bookedTimesForNextDate)}
              </>
            )}
            <button onClick={confirmBookNext} disabled={!bookNextDate || !bookNextTime}
              className="w-full bg-white text-black py-3 rounded-full font-semibold mt-6 disabled:opacity-30 hover:bg-gray-200 transition">
              Confirm
            </button>
          </div>
        </div>
      )}

    </main>
  )
}