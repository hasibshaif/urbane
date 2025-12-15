import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Users, User, Mail, X } from 'lucide-react'
import { eventApi, type BackendEvent, type BackendProfile } from '../services/api'

const EventDetailPage = () => {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<BackendEvent | null>(null)
  const [attendees, setAttendees] = useState<BackendProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAttendee, setSelectedAttendee] = useState<BackendProfile | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(userStr))
  }, [navigate])

  useEffect(() => {
    if (!eventId) {
      setError('Invalid event ID')
      setLoading(false)
      return
    }

    const loadEventDetails = async () => {
      try {
        setLoading(true)
        setError('')

        const eventData = await eventApi.getEventById(parseInt(eventId, 10))
        setEvent(eventData)

        // Load attendees
        try {
          const attendeesData = await eventApi.getEventAttendees(parseInt(eventId, 10))
          setAttendees(attendeesData)
        } catch (err) {
          console.error('Failed to load attendees:', err)
          setAttendees([])
        }
      } catch (err) {
        console.error('Failed to load event:', err)
        setError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    loadEventDetails()
  }, [eventId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const handleJoinEvent = async () => {
    if (!user || !event) return

    try {
      await eventApi.joinEvent(user.id, event.id)
      // Reload event and attendees
      const eventData = await eventApi.getEventById(event.id)
      setEvent(eventData)
      const attendeesData = await eventApi.getEventAttendees(event.id)
      setAttendees(attendeesData)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join event')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-cyan-400">Loading event details...</div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Link to="/home" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="text-red-400">{error || 'Event not found'}</div>
        </div>
      </div>
    )
  }

  const isCreator = event.creator?.id === user?.id
  // Check if user is attending by comparing user ID with attendee profile IDs
  // Note: attendee.id is the profile ID, which matches user_id
  const isAttending = attendees.some(a => a.id === user?.id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glow-card relative p-[1px] rounded-2xl"
            >
              <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-900/80 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                    {event.creator && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="h-4 w-4" />
                        <span>
                          Created by {isCreator ? 'You' : `${event.creator.profile?.firstName || event.creator.email}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="text-slate-300 mb-6 leading-relaxed">{event.description}</p>
                )}

                <div className="space-y-4">
                  {event.date && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                  )}

                  {(event.city || event.state) && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <MapPin className="h-5 w-5 text-cyan-400" />
                      <span>
                        {event.city && event.state
                          ? `${event.city}, ${event.state}`
                          : event.city || event.state || 'Location TBD'}
                        {event.country && `, ${event.country}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-slate-300">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <span>
                      {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
                      {event.capacity && ` / ${event.capacity} max`}
                    </span>
                  </div>
                </div>

                {!isCreator && !isAttending && (
                  <motion.button
                    onClick={handleJoinEvent}
                    className="mt-6 w-full rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Join Event
                  </motion.button>
                )}

                {isCreator && (
                  <div className="mt-6 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-center text-cyan-200">
                    Your Event
                  </div>
                )}

                {isAttending && !isCreator && (
                  <div className="mt-6 rounded-xl border border-green-400/50 bg-green-400/10 px-4 py-3 text-center text-green-200">
                    You're Attending
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Attendees Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glow-card relative p-[1px] rounded-2xl"
            >
              <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-900/80 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Attendees ({attendees.length})
                </h2>

                {attendees.length === 0 ? (
                  <p className="text-slate-400 text-sm">No attendees yet</p>
                ) : (
                  <div className="space-y-3">
                    {attendees.map((attendee) => (
                      <motion.button
                        key={attendee.id}
                        onClick={() => setSelectedAttendee(attendee)}
                        className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition border border-slate-700/50 hover:border-cyan-400/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          {attendee.photo ? (
                            <img
                              src={attendee.photo}
                              alt={attendee.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-semibold">
                              {attendee.firstName?.[0] || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">
                              {attendee.firstName} {attendee.lastName}
                            </div>
                            {attendee.age && (
                              <div className="text-xs text-slate-400">Age {attendee.age}</div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Attendee Profile Modal */}
      {selectedAttendee && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAttendee(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glow-card relative p-[1px] rounded-2xl max-w-md w-full"
          >
            <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-900 p-6">
              <button
                onClick={() => setSelectedAttendee(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center mb-6">
                {selectedAttendee.photo ? (
                  <img
                    src={selectedAttendee.photo}
                    alt={selectedAttendee.firstName}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-2xl mb-4">
                    {selectedAttendee.firstName?.[0] || '?'}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white">
                  {selectedAttendee.firstName} {selectedAttendee.lastName}
                </h3>
                {selectedAttendee.age && (
                  <p className="text-slate-400 mt-1">Age {selectedAttendee.age}</p>
                )}
              </div>

              <div className="space-y-4">
                {selectedAttendee.phoneNumber && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <span>{selectedAttendee.phoneNumber}</span>
                  </div>
                )}

                {selectedAttendee.location && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span>
                      {typeof selectedAttendee.location === 'string'
                        ? selectedAttendee.location
                        : selectedAttendee.location?.city && selectedAttendee.location?.state
                        ? `${selectedAttendee.location.city}, ${selectedAttendee.location.state}`
                        : 'Location not specified'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage

