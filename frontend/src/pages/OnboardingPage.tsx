import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Globe, Heart, Plane, TentTree } from 'lucide-react'
import { profileApi, interestApi, type ProfileRequest, type ExtendedProfileData } from '../services/api'

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

const ACTIVITY_TYPE_OPTIONS = [
  'Outdoor Activities',
  'Cultural Experiences',
  'Nightlife & Entertainment',
  'Food & Culinary',
  'Relaxation & Wellness',
  'Adventure & Sports',
  'Shopping & Markets',
  'Social & Networking',
] as const

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [photo, setPhoto] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [travelStyle, setTravelStyle] = useState('')
  const [preferredActivities, setPreferredActivities] = useState<string[]>([])
  const [bio, setBio] = useState('')

  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getMaxDate = (): string => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 18)
    return date.toISOString().split('T')[0]
  }

  const toggleSelection = (item: string, items: string[], setItems: (items: string[]) => void) => {
    setItems(items.includes(item) ? items.filter((i) => i !== item) : [...items, item])
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    // Final validation before submission
    if (!firstName.trim()) {
      setError('Please enter your first name')
      return
    }

    if (!lastName.trim()) {
      setError('Please enter your last name')
      return
    }

    if (!dateOfBirth) {
      setError('Please enter your date of birth')
      return
    }

    const age = calculateAge(dateOfBirth)
    if (age < 18) {
      setError('You must be at least 18 years old to use this platform')
      return
    }

    if (selectedLanguages.length === 0) {
      setError('Please select at least one language')
      return
    }

    if (selectedInterests.length === 0) {
      setError('Please select at least one interest')
      return
    }

    if (!travelStyle) {
      setError('Please select a travel style')
      return
    }

    if (preferredActivities.length === 0) {
      setError('Please select at least one preferred activity type')
      return
    }

    setLoading(true)

    const userStr = localStorage.getItem('user')
    if (!userStr) {
      setError('User session expired. Please log in again.')
      setLoading(false)
      navigate('/login')
      return
    }

    let userId: number
    try {
      const userData = JSON.parse(userStr)
      if (!userData.id || typeof userData.id !== 'number') {
        setError('Invalid user session. Please log in again.')
        setLoading(false)
        navigate('/login')
        return
      }
      userId = userData.id
    } catch {
      setError('Invalid user session. Please log in again.')
      setLoading(false)
      navigate('/login')
      return
    }
    const userAge = calculateAge(dateOfBirth)

    // Prepare profile data for backend (only fields backend supports)
    const profileData: ProfileRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: userAge,
      photo: photo.trim() || null,
      location: null, // Can be added later if needed
    }

    // Store extended profile data in localStorage (for future backend support)
    const extendedData: ExtendedProfileData = {
      dateOfBirth,
      languages: selectedLanguages,
      interests: selectedInterests,
      travelStyle: travelStyle || undefined,
      preferredActivityTypes: preferredActivities,
      bio: bio.trim() || undefined,
    }

    try {
      console.log('Saving profile for user:', userId, profileData)
      
      // Save profile to backend
      const savedProfile = await profileApi.saveProfile(userId, profileData)
      console.log('Profile saved:', savedProfile)
      
      // Save interests to backend
      if (selectedInterests.length > 0) {
        try {
          console.log('Saving interests:', selectedInterests)
          await interestApi.addInterestsToUser(userId, selectedInterests)
          console.log('Interests saved successfully')
        } catch (interestErr) {
          console.error('Failed to save interests:', interestErr)
          // Continue even if interests fail to save
        }
      }
      
      // Store extended data in localStorage for future use
      localStorage.setItem(`profile_extended_${userId}`, JSON.stringify(extendedData))
      
      // Update user object in localStorage with profile info
      if (userStr) {
        const userData = JSON.parse(userStr)
        userData.firstName = firstName.trim()
        userData.lastName = lastName.trim()
        localStorage.setItem('user', JSON.stringify(userData))
      }
      
      console.log('Navigating to /home')
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (!token || !user) {
      navigate('/login')
      return
    }

    // Check if profile already exists in backend - if so, redirect to home
    if (user) {
      const checkProfile = async () => {
        try {
          const userData = JSON.parse(user)
          const profile = await profileApi.fetchProfile(userData.id)
          // If profile exists with required fields, user already completed onboarding
          if (profile.firstName && profile.lastName) {
            navigate('/home', { replace: true })
            return
          }
        } catch {
          // Profile doesn't exist, continue with onboarding
          console.log('Profile not found, continuing with onboarding')
        }
      }
      checkProfile()
    }

    // Load firstName and lastName from registration or user data
    const pendingFirstName = localStorage.getItem('pendingFirstName')
    const pendingLastName = localStorage.getItem('pendingLastName')
    const userData = user ? JSON.parse(user) : null

    if (pendingFirstName) {
      setFirstName(pendingFirstName)
      localStorage.removeItem('pendingFirstName')
    } else if (userData?.firstName) {
      setFirstName(userData.firstName)
    }

    if (pendingLastName) {
      setLastName(pendingLastName)
      localStorage.removeItem('pendingLastName')
    } else if (userData?.lastName) {
      setLastName(userData.lastName)
    }
  }, [navigate])

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null


  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 md:py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          <div className="glow-card relative p-[1px]">
            <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-950/80 p-8">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-semibold text-white">Tell us about yourself</h2>
                <p className="mt-2 text-sm text-slate-300">Help us match you with like-minded travelers</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </motion.div>
              )}

              <form className="space-y-8" onSubmit={async (e) => {
                e.preventDefault()
                if (step === totalSteps) {
                  await handleSubmit(e)
                }
              }}>
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="mb-2 text-sm font-medium text-slate-200">
                          First Name
                        </label>
                        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                          <input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder="John"
                            className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="lastName" className="mb-2 text-sm font-medium text-slate-200">
                          Last Name
                        </label>
                        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                          <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            placeholder="Doe"
                            className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dateOfBirth" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <Calendar className="h-4 w-4 text-cyan-300" />
                        Date of Birth
                      </label>
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                        <input
                          id="dateOfBirth"
                          type="date"
                          max={getMaxDate()}
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          required
                          className="w-full border-none bg-transparent text-sm text-slate-100 focus:outline-none"
                        />
                      </div>
                      {age !== null && age >= 18 && <p className="mt-2 text-xs text-cyan-200">Age: {age} years</p>}
                      {age !== null && age < 18 && <p className="mt-2 text-xs text-red-300">You must be at least 18 years old</p>}
                    </div>

                    <div>
                      <label htmlFor="photo" className="mb-2 text-sm font-medium text-slate-200">
                        Photo URL (optional)
                      </label>
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                        <input
                          id="photo"
                          type="url"
                          value={photo}
                          onChange={(e) => setPhoto(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="languages" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <Globe className="h-4 w-4 text-cyan-300" />
                        Languages (select at least one)
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {LANGUAGE_OPTIONS.map((language) => (
                          <motion.button
                            key={language}
                            type="button"
                            onClick={() => toggleSelection(language, selectedLanguages, setSelectedLanguages)}
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
                      {step === 1 && selectedLanguages.length === 0 && (
                        <p className="mt-2 text-xs text-slate-400">Please select at least one language</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <Heart className="h-4 w-4 text-cyan-300" />
                        Interests (select at least one)
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {INTEREST_OPTIONS.map((interest) => (
                          <motion.button
                            key={interest}
                            type="button"
                            onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
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
                    </div>

                    <div>
                      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <Plane className="h-4 w-4 text-cyan-300" />
                        Travel Style
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {TRAVEL_STYLE_OPTIONS.map((style) => (
                          <motion.button
                            key={style.value}
                            type="button"
                            onClick={() => setTravelStyle(style.value)}
                            className={`rounded-lg border px-4 py-3 text-sm transition ${
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

                    <div>
                      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <TentTree className="h-4 w-4 text-cyan-300" />
                        Preferred Activity Types (select at least one)
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {ACTIVITY_TYPE_OPTIONS.map((activity) => (
                          <motion.button
                            key={activity}
                            type="button"
                            onClick={() => toggleSelection(activity, preferredActivities, setPreferredActivities)}
                            className={`rounded-lg border px-3 py-2 text-xs transition ${
                              preferredActivities.includes(activity)
                                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {activity}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="bio" className="mb-2 text-sm font-medium text-slate-200">Bio (optional)</label>
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                        <textarea
                          id="bio"
                          rows={4}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell others a bit about yourself and your travel style..."
                          maxLength={500}
                          className="w-full resize-none border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{bio.length}/500 characters</p>
                    </div>

                    <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">
                      <p className="font-medium text-cyan-200">Review your selections:</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Name: {firstName} {lastName}</li>
                        <li>• Age: {age || 'Not set'}</li>
                        {photo && <li>• Photo: Provided</li>}
                        <li>• Languages: {selectedLanguages.length} selected</li>
                        <li>• Interests: {selectedInterests.length} selected</li>
                        {travelStyle && (
                          <li>• Travel Style: {TRAVEL_STYLE_OPTIONS.find((s) => s.value === travelStyle)?.label}</li>
                        )}
                        <li>• Preferred Activity Types: {preferredActivities.length} selected</li>
                        {bio && <li>• Bio: {bio.length} characters</li>}
                      </ul>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between gap-4 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    whileHover={{ scale: step === 1 ? 1 : 1.02 }}
                    whileTap={{ scale: step === 1 ? 1 : 0.98 }}
                  >
                    Back
                  </motion.button>

                  {step < totalSteps ? (
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setError('')
                        
                        // Validate step 1 before moving to step 2
                        if (step === 1) {
                          if (!firstName.trim()) {
                            setError('Please enter your first name')
                            return
                          }
                          if (!lastName.trim()) {
                            setError('Please enter your last name')
                            return
                          }
                          if (!dateOfBirth) {
                            setError('Please enter your date of birth')
                            return
                          }
                          const age = calculateAge(dateOfBirth)
                          if (age < 18) {
                            setError('You must be at least 18 years old to use this platform')
                            return
                          }
                          if (selectedLanguages.length === 0) {
                            setError('Please select at least one language')
                            return
                          }
                        }
                        
                        // Validate step 2 before moving to step 3
                        if (step === 2) {
                          if (selectedInterests.length === 0) {
                            setError('Please select at least one interest')
                            return
                          }
                          if (!travelStyle) {
                            setError('Please select a travel style')
                            return
                          }
                          if (preferredActivities.length === 0) {
                            setError('Please select at least one preferred activity type')
                            return
                          }
                        }
                        
                        setStep(Math.min(totalSteps, step + 1))
                      }}
                      className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? 'Completing...' : 'Complete Profile'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default OnboardingPage

