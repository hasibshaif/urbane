import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Users, LogOut, X, User as UserIcon, Eye, Heart, XCircle, Sparkles } from 'lucide-react'
import { eventApi, authApi, matchmakingApi, type BackendEvent, type CreateEventRequest, type BackendProfile, type PotentialMatch } from '../services/api'

interface EventWithAttendees extends BackendEvent {
  attendeeCount?: number
}

const HomePage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'friends' | 'events'>('friends')
  const [events, setEvents] = useState<EventWithAttendees[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState<{ id: number; email: string; firstName?: string; lastName?: string } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventWithAttendees | null>(null)
  const [eventAttendees, setEventAttendees] = useState<BackendProfile[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<BackendProfile | null>(null)
  
  // Matchmaking state
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [viewingMatchProfile, setViewingMatchProfile] = useState<PotentialMatch | null>(null)

  // Form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventCapacity, setEventCapacity] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventCity, setEventCity] = useState('')
  const [eventState, setEventState] = useState('')
  const [eventCountry, setEventCountry] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(userStr)
    setUser(userData)

    // Fetch events - for now, we'll fetch all events by a default state
    // In the future, this should be based on user's location
    loadEvents()
    loadPotentialMatches(userData.id)
  }, [navigate])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch all events (we'll filter by location later when user profile has location)
      const allEvents = await eventApi.getAllEvents()
      
      // Fetch attendee counts for each event
      const eventsWithAttendees = await Promise.all(
        allEvents.map(async (event) => {
          try {
            const attendeeCount = await eventApi.getAttendeesCount(event.id)
            return { ...event, attendeeCount }
          } catch {
            return { ...event, attendeeCount: 0 }
          }
        })
      )
      
      setEvents(eventsWithAttendees)
    } catch (err) {
      console.error('Failed to load events:', err)
      setError('Failed to load events. Please try again later.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setCreating(true)
    setError('')

    try {
      // Validate title length (max 25 characters per backend constraint)
      if (eventTitle.trim().length > 25) {
        setError('Event title must be 25 characters or less')
        setCreating(false)
        return
      }

      // Validate description length (max 50 characters per backend constraint)
      if (eventDescription.trim().length > 50) {
        setError('Event description must be 50 characters or less')
        setCreating(false)
        return
      }

      const eventData: CreateEventRequest = {
        title: eventTitle.trim().substring(0, 25), // Ensure max 25 chars
        description: eventDescription.trim() ? eventDescription.trim().substring(0, 50) : null, // Ensure max 50 chars
        capacity: eventCapacity ? parseInt(eventCapacity, 10) : null,
        date: eventDate || null,
        // Only include location fields if they have values (not empty strings)
        city: eventCity.trim() || null,
        state: eventState.trim() || null,
        country: eventCountry.trim() || null,
        latitude: null,
        longitude: null,
        creatorId: user.id, // Set the creator
      }

      console.log('Creating event with data:', eventData)

      await eventApi.createEvent(eventData)
      
      // Reset form
      setEventTitle('')
      setEventDescription('')
      setEventCapacity('')
      setEventDate('')
      setEventCity('')
      setEventState('')
      setEventCountry('')
      setShowCreateForm(false)
      
      // Reload events
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinEvent = async (eventId: number) => {
    if (!user) return

    // Don't allow joining your own event
    const event = events.find(e => e.id === eventId)
    if (event?.creator?.id === user.id) {
      alert('You cannot join your own event')
      return
    }

    try {
      console.log('Joining event:', eventId, 'for user:', user.id)
      await eventApi.joinEvent(user.id, eventId)
      // Reload events to get updated attendee counts
      await loadEvents()
      // If viewing event details, reload attendees
      if (selectedEvent?.id === eventId) {
        loadEventAttendees(eventId)
      }
    } catch (err) {
      console.error('Error joining event:', err)
      alert(err instanceof Error ? err.message : 'Failed to join event')
    }
  }

  const handleViewEventDetails = async (event: EventWithAttendees) => {
    setSelectedEvent(event)
    await loadEventAttendees(event.id)
  }

  const loadEventAttendees = async (eventId: number) => {
    try {
      setLoadingAttendees(true)
      const attendees = await eventApi.getEventAttendees(eventId)
      setEventAttendees(attendees)
    } catch (err) {
      console.error('Failed to load attendees:', err)
      setEventAttendees([])
    } finally {
      setLoadingAttendees(false)
    }
  }

  const handleCloseEventDetails = () => {
    setSelectedEvent(null)
    setEventAttendees([])
    setSelectedProfile(null)
  }

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  const loadPotentialMatches = async (userId: number) => {
    try {
      setLoadingMatches(true)
      const matches = await matchmakingApi.getPotentialMatches(userId)
      setPotentialMatches(matches)
      setCurrentMatchIndex(0)
    } catch (err) {
      console.error('Failed to load potential matches:', err)
      setPotentialMatches([])
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleYesFriend = async (match: PotentialMatch) => {
    if (!user) return
    
    try {
      await matchmakingApi.sendFriendRequest(user.id, match.userId)
      // Remove this match from the list and move to next
      const newMatches = potentialMatches.filter(m => m.userId !== match.userId)
      setPotentialMatches(newMatches)
      if (currentMatchIndex >= newMatches.length && newMatches.length > 0) {
        setCurrentMatchIndex(newMatches.length - 1)
      } else if (newMatches.length === 0) {
        setCurrentMatchIndex(0)
      }
      setViewingMatchProfile(null)
    } catch (err) {
      console.error('Failed to send friend request:', err)
      alert('Failed to send friend request. Please try again.')
    }
  }

  const handleNoFriend = async (match: PotentialMatch) => {
    if (!user) return
    
    try {
      await matchmakingApi.rejectFriendRequest(user.id, match.userId)
      // Remove this match from the list and move to next
      const newMatches = potentialMatches.filter(m => m.userId !== match.userId)
      setPotentialMatches(newMatches)
      if (currentMatchIndex >= newMatches.length && newMatches.length > 0) {
        setCurrentMatchIndex(newMatches.length - 1)
      } else if (newMatches.length === 0) {
        setCurrentMatchIndex(0)
      }
      setViewingMatchProfile(null)
    } catch (err) {
      console.error('Failed to reject friend request:', err)
      alert('Failed to process. Please try again.')
    }
  }

  const handleViewMatchProfile = (match: PotentialMatch) => {
    setViewingMatchProfile(match)
  }

  const currentMatch = potentialMatches[currentMatchIndex]

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Date TBD'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-hero-gradient opacity-95" />
      <motion.div
        className="pointer-events-none absolute -top-40 right-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-10rem] left-[-6rem] h-[32rem] w-[32rem] rounded-full bg-sky-400/15 blur-3xl"
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-8 sm:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logos/urbane-logo.png" alt="Urbane" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="font-display text-xl font-semibold text-white">Urbane</h1>
              <p className="text-sm text-slate-400">
                Welcome back, {user.firstName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-4 w-4" />
              Create Event
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </motion.button>
          </div>
        </header>

        {/* Create Event Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-2xl rounded-2xl bg-slate-900 p-8 shadow-2xl"
            >
              <button
                onClick={() => setShowCreateForm(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="mb-6 font-display text-2xl font-semibold text-white">Create New Event</h2>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Event Title * (max 25 characters)</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    maxLength={25}
                    placeholder="e.g., A walk through Central Park"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">{eventTitle.length}/25 characters</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Description (max 50 characters)</label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={3}
                    maxLength={50}
                    placeholder="Tell people about your event..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">{eventDescription.length}/50 characters</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Max Attendees</label>
                    <input
                      type="number"
                      value={eventCapacity}
                      onChange={(e) => setEventCapacity(e.target.value)}
                      min="1"
                      placeholder="No limit"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Date</label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">City</label>
                    <input
                      type="text"
                      value={eventCity}
                      onChange={(e) => setEventCity(e.target.value)}
                      placeholder="New York"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">State</label>
                    <input
                      type="text"
                      value={eventState}
                      onChange={(e) => setEventState(e.target.value)}
                      placeholder="NY"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Country</label>
                    <input
                      type="text"
                      value={eventCountry}
                      onChange={(e) => setEventCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-xl border border-white/10 px-6 py-2 text-sm text-slate-300 transition hover:border-cyan-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    whileHover={{ scale: creating ? 1 : 1.02 }}
                    whileTap={{ scale: creating ? 1 : 0.98 }}
                  >
                    {creating ? 'Creating...' : 'Create Event'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <main>
          {/* Tabs */}
          <div className="mb-8 flex gap-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('friends')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'friends'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Find Friends
              </div>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'events'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events
              </div>
            </button>
          </div>

          {/* Find Friends Section */}
          {activeTab === 'friends' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Find Your Travel Companions
                </h2>
                <p className="mt-2 text-slate-300">Discover people with similar interests and travel preferences</p>
              </div>

              {loadingMatches ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Finding your perfect matches...</p>
                </div>
              ) : potentialMatches.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-cyan-300" />
                  <p className="text-slate-300 text-lg mb-2">No matches found at the moment</p>
                  <p className="text-slate-400">Check back later or update your profile to find more matches!</p>
                </div>
              ) : currentMatch ? (
                <div className="max-w-2xl mx-auto">
                  <motion.div
                    key={currentMatch.userId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glow-card relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-8"
                  >
                    {/* Profile Header */}
                    <div className="flex items-start gap-6 mb-6">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-sky-400/20 text-cyan-300 border-2 border-cyan-400/30">
                        {currentMatch.profile.photo ? (
                          <img
                            src={currentMatch.profile.photo}
                            alt={`${currentMatch.profile.firstName} ${currentMatch.profile.lastName}`}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-12 w-12" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-2xl font-semibold text-white mb-1">
                          {currentMatch.profile.firstName && currentMatch.profile.lastName
                            ? `${currentMatch.profile.firstName} ${currentMatch.profile.lastName}`
                            : 'Anonymous User'}
                        </h3>
                        {currentMatch.profile.age && (
                          <p className="text-slate-400 mb-2">Age: {currentMatch.profile.age}</p>
                        )}
                        {currentMatch.profile.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <MapPin className="h-4 w-4 text-cyan-300" />
                            <span>
                              {currentMatch.profile.location.city && currentMatch.profile.location.state
                                ? `${currentMatch.profile.location.city}, ${currentMatch.profile.location.state}`
                                : currentMatch.profile.location.country || 'Location not specified'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Similarities */}
                    {currentMatch.similarities.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                        <p className="text-sm font-semibold text-cyan-200 mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          What you have in common:
                        </p>
                        <ul className="space-y-1">
                          {currentMatch.similarities.map((similarity, idx) => (
                            <li key={idx} className="text-sm text-cyan-100">• {similarity}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bio */}
                    {currentMatch.profile.bio && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-slate-300 mb-2">About</p>
                        <p className="text-slate-200 leading-relaxed">{currentMatch.profile.bio}</p>
                      </div>
                    )}

                    {/* Interests */}
                    {currentMatch.interests.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-slate-300 mb-3">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {currentMatch.interests.map((interest) => (
                            <span
                              key={interest.id}
                              className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs border border-cyan-400/30"
                            >
                              {interest.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-white/10">
                      <motion.button
                        onClick={() => handleNoFriend(currentMatch)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-400/50 bg-gradient-to-br from-red-400/10 to-red-500/5 px-6 py-4 text-red-200 font-semibold transition hover:from-red-400/20 hover:to-red-500/10 hover:border-red-400 hover:shadow-lg hover:shadow-red-400/20"
                        whileHover={{ scale: 0.98, rotate: -1 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm">No Thanks</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleYesFriend(currentMatch)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-green-400/50 bg-gradient-to-br from-green-400/20 to-emerald-400/10 px-6 py-4 text-green-100 font-bold transition hover:from-green-400/30 hover:to-emerald-400/20 hover:border-green-300 shadow-lg shadow-green-400/30 hover:shadow-green-400/50"
                        whileHover={{ scale: 1.08, rotate: 3, y: -2 }}
                        whileTap={{ scale: 0.92 }}
                        animate={{ 
                          boxShadow: [
                            "0 10px 25px -5px rgba(34, 197, 94, 0.3)",
                            "0 15px 35px -5px rgba(34, 197, 94, 0.4)",
                            "0 10px 25px -5px rgba(34, 197, 94, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Heart className="h-6 w-6 fill-green-400 text-green-400" />
                        </motion.div>
                        <span className="text-sm">Yes! Let's Connect 💫</span>
                      </motion.button>
                    </div>

                    {/* Match Counter */}
                    <div className="mt-4 text-center text-xs text-slate-400">
                      Match {currentMatchIndex + 1} of {potentialMatches.length}
                    </div>
                  </motion.div>

                  {/* Navigation */}
                  {potentialMatches.length > 1 && (
                    <div className="flex justify-center gap-4 mt-6">
                      <motion.button
                        onClick={() => setCurrentMatchIndex(Math.max(0, currentMatchIndex - 1))}
                        disabled={currentMatchIndex === 0}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-300 hover:text-white transition"
                        whileHover={{ scale: currentMatchIndex === 0 ? 1 : 1.02 }}
                        whileTap={{ scale: currentMatchIndex === 0 ? 1 : 0.98 }}
                      >
                        Previous
                      </motion.button>
                      <motion.button
                        onClick={() => setCurrentMatchIndex(Math.min(potentialMatches.length - 1, currentMatchIndex + 1))}
                        disabled={currentMatchIndex === potentialMatches.length - 1}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-300 hover:text-white transition"
                        whileHover={{ scale: currentMatchIndex === potentialMatches.length - 1 ? 1 : 1.02 }}
                        whileTap={{ scale: currentMatchIndex === potentialMatches.length - 1 ? 1 : 0.98 }}
                      >
                        Next
                      </motion.button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Events Section */}
          {activeTab === 'events' && (
            <div>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Nearby Events
                </h2>
                <p className="mt-2 text-slate-300">Discover and join events happening around you</p>
              </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading events...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-slate-400">No events found. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glow-card relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white">{event.title}</h3>
                      {event.description && (
                        <p className="mt-2 text-sm text-slate-300 line-clamp-2">{event.description}</p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-400">
                      {event.creator && (
                        <div className="text-xs text-cyan-200">
                          Created by: {event.creator.profile?.firstName || event.creator.email}
                        </div>
                      )}
                      {event.city && event.state && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-cyan-300" />
                          <span>{event.city}, {event.state}</span>
                        </div>
                      )}
                      {event.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-cyan-300" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-300" />
                        <span>
                          {event.attendeeCount !== undefined && (
                            <>{event.attendeeCount} {event.capacity ? `/${event.capacity}` : ''} attending</>
                          )}
                          {event.attendeeCount === undefined && (
                            <>{event.capacity ? `Up to ${event.capacity} people` : 'Unlimited capacity'}</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleViewEventDetails(event)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:bg-white/10 hover:text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </motion.button>
                      {event.creator?.id === user?.id ? (
                        <span className="flex-1 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-center text-sm text-cyan-200">
                          Your Event
                        </span>
                      ) : (
                        <motion.button
                          onClick={() => handleJoinEvent(event.id)}
                          className="flex-1 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Join Event
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
            </div>
          )}
        </main>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-4xl rounded-2xl bg-slate-900 p-8 shadow-2xl my-8"
            >
              <button
                onClick={handleCloseEventDetails}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                {/* Event Header */}
                <div>
                  <h2 className="font-display text-3xl font-semibold text-white mb-2">{selectedEvent.title}</h2>
                  {selectedEvent.description && (
                    <p className="text-slate-300">{selectedEvent.description}</p>
                  )}
                </div>

                {/* Event Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedEvent.creator && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <UserIcon className="h-5 w-5 text-cyan-300" />
                      <span>
                        <span className="text-slate-400">Created by:</span>{' '}
                        {selectedEvent.creator.profile?.firstName && selectedEvent.creator.profile?.lastName
                          ? `${selectedEvent.creator.profile.firstName} ${selectedEvent.creator.profile.lastName}`
                          : selectedEvent.creator.email}
                      </span>
                    </div>
                  )}
                  {selectedEvent.city && selectedEvent.state && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-5 w-5 text-cyan-300" />
                      <span>{selectedEvent.city}, {selectedEvent.state}{selectedEvent.country ? `, ${selectedEvent.country}` : ''}</span>
                    </div>
                  )}
                  {selectedEvent.date && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="h-5 w-5 text-cyan-300" />
                      <span>{formatDate(selectedEvent.date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-5 w-5 text-cyan-300" />
                    <span>
                      {selectedEvent.attendeeCount !== undefined ? (
                        <>{selectedEvent.attendeeCount} {selectedEvent.capacity ? `/${selectedEvent.capacity}` : ''} attending</>
                      ) : (
                        <>{selectedEvent.capacity ? `Up to ${selectedEvent.capacity} people` : 'Unlimited capacity'}</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Attendees Section */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="font-display text-xl font-semibold text-white mb-4">Attendees</h3>
                  
                  {loadingAttendees ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">Loading attendees...</p>
                    </div>
                  ) : eventAttendees.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
                      <p className="text-slate-400">No attendees yet. Be the first to join!</p>
                      {selectedEvent.creator?.id !== user?.id && (
                        <motion.button
                          onClick={() => handleJoinEvent(selectedEvent.id)}
                          className="mt-4 rounded-xl bg-cyan-400 px-6 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Join Event
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {eventAttendees.map((attendee) => (
                          <motion.div
                            key={attendee.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-cyan-300/50 transition cursor-pointer"
                            onClick={() => setSelectedProfile(attendee)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300">
                                <UserIcon className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white">
                                  {attendee.firstName && attendee.lastName
                                    ? `${attendee.firstName} ${attendee.lastName}`
                                    : 'Anonymous User'}
                                </h4>
                                {attendee.age && (
                                  <p className="text-sm text-slate-400">Age: {attendee.age}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {selectedEvent.creator?.id !== user?.id && (
                        <motion.button
                          onClick={() => handleJoinEvent(selectedEvent.id)}
                          className="w-full rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Join Event
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Profile View Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl"
            >
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {selectedProfile.firstName && selectedProfile.lastName
                        ? `${selectedProfile.firstName} ${selectedProfile.lastName}`
                        : 'Anonymous User'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  {selectedProfile.age && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Age</span>
                      <span className="text-white">{selectedProfile.age}</span>
                    </div>
                  )}
                  {selectedProfile.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location</span>
                      <span className="text-white">
                        {selectedProfile.location.city && selectedProfile.location.state
                          ? `${selectedProfile.location.city}, ${selectedProfile.location.state}`
                          : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage

