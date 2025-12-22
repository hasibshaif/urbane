import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Heart, Globe, User as UserIcon, Lock, Plane } from 'lucide-react'
import { profileApi, interestApi, type BackendProfile, type BackendInterest } from '../services/api'

const INTEREST_OPTIONS = [
  'Hiking',
  'Food & Dining',
  'Beach & Water Sports',
  'Nightlife',
  'Museums & Culture',
  'Photography',
  'Music & Concerts',
  'Adventure Sports',
  'Shopping',
  'Nature & Wildlife',
  'Local Events',
  'Cooking Classes',
  'Historical Sites',
  'Festivals',
  'Wellness & Yoga',
  'Art & Galleries',
] as const

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Japanese',
  'Chinese',
  'Korean',
  'Arabic',
  'Bengali',
  'Hindi',
  'Russian',
] as const

const TRAVEL_STYLE_OPTIONS = [
  { value: 'solo', label: 'Solo traveler' },
  { value: 'group', label: 'Group traveler' },
  { value: 'mixed', label: 'Mix of both' },
  { value: 'flexible', label: 'Flexible' },
] as const

const ProfilePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ id: number; email: string; firstName?: string; lastName?: string } | null>(null)
  const [profile, setProfile] = useState<BackendProfile | null>(null)
  const [interests, setInterests] = useState<BackendInterest[]>([])
  const [allInterests, setAllInterests] = useState<BackendInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [travelStyle, setTravelStyle] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(userStr)
    setUser(userData)
    loadProfileData(userData.id)
  }, [navigate])

  const loadProfileData = async (userId: number) => {
    try {
      setLoading(true)
      setError('')

      // Load profile
      const profileData = await profileApi.fetchProfile(userId)
      setProfile(profileData)
      setBio(profileData.bio || '')
      setPhoto(profileData.photo || '')
      setTravelStyle(profileData.travelStyle || '')
      // Parse languages from comma-separated string
      if (profileData.languages) {
        setSelectedLanguages(profileData.languages.split(',').map(l => l.trim()).filter(l => l))
      } else {
        setSelectedLanguages([])
      }

      // Load interests using the simple interests endpoint
      try {
        const userInterests = await interestApi.getUserInterests(userId)
        setInterests(userInterests)
        setSelectedInterests(userInterests.map(i => i.name))
      } catch (interestErr) {
        console.warn('Failed to load interests:', interestErr)
        setInterests([])
        setSelectedInterests([])
      }

      // Load all available interests
      const allInterestsData = await interestApi.getAllInterests()
      setAllInterests(allInterestsData)
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleInterest = (interestName: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestName)
        ? prev.filter(i => i !== interestName)
        : [...prev, interestName]
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update profile (bio, photo, interests)
      const updateData: any = {
        bio: bio.trim() || null,
        photo: photo.trim() || null,
        interests: selectedInterests,
        travelStyle: travelStyle || null,
        languages: selectedLanguages,
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/updateProfileEditable/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully!')
      
      // Reload profile data to reflect changes
      await loadProfileData(user.id)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-400">Profile not found</p>
        </div>
      </div>
    )
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

      <div className="relative z-10 mx-auto min-h-screen max-w-4xl px-4 pb-20 pt-8 sm:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </motion.button>
            <div>
              <h1 className="font-display text-xl font-semibold text-white">Edit Profile</h1>
              <p className="text-sm text-slate-400">Update your interests and bio</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glow-card relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-8"
          >
            {/* Success/Error Messages */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200"
              >
                {success}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Read-only Info Section */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-400" />
                  Account Information (Cannot be changed)
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Name</label>
                    <p className="text-white mt-1">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Email</label>
                    <p className="text-white mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Age</label>
                    <p className="text-white mt-1">{profile.age || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="photo" className="mb-2 block text-sm font-medium text-slate-200">
                    Photo URL
                  </label>
                  <input
                    id="photo"
                    type="url"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                  />
                  {photo && (
                    <div className="mt-3">
                      <img
                        src={photo}
                        alt="Profile preview"
                        className="h-24 w-24 rounded-full object-cover border-2 border-cyan-400/30"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="mb-2 block text-sm font-medium text-slate-200">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself and your travel style..."
                    maxLength={500}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none resize-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">{bio.length}/500 characters</p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-cyan-300" />
                    Interests (select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {INTEREST_OPTIONS.map((interest) => (
                      <motion.button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          selectedInterests.includes(interest)
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {interest}
                      </motion.button>
                    ))}
                  </div>
                  {selectedInterests.length === 0 && (
                    <p className="mt-2 text-xs text-red-300">Please select at least one interest</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-300" />
                    Languages (select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <motion.button
                        key={language}
                        type="button"
                        onClick={() => {
                          setSelectedLanguages(prev =>
                            prev.includes(language)
                              ? prev.filter(l => l !== language)
                              : [...prev, language]
                          )
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          selectedLanguages.includes(language)
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {language}
                      </motion.button>
                    ))}
                  </div>
                  {selectedLanguages.length === 0 && (
                    <p className="mt-2 text-xs text-red-300">Please select at least one language</p>
                  )}
                </div>

                <div>
                  <label htmlFor="travelStyle" className="mb-2 block text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Plane className="h-4 w-4 text-cyan-300" />
                    Travel Style
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TRAVEL_STYLE_OPTIONS.map((style) => (
                      <motion.button
                        key={style.value}
                        type="button"
                        onClick={() => setTravelStyle(style.value)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          travelStyle === style.value
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {style.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <motion.button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="rounded-xl border border-white/10 px-6 py-2 text-sm text-slate-300 transition hover:border-cyan-300 hover:text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={saving || selectedInterests.length === 0 || selectedLanguages.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage

