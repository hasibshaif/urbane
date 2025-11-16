import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Globe, Heart, Plane, TentTree } from 'lucide-react'
import {
  onboardingApi,
  type OnboardingRequest,
} from '../services/api'
import { localProfile, localAuth } from '../services/localStorage'

// Predetermined interest list for matchmaking
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
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Form state
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [travelStyle, setTravelStyle] = useState('')
  const [preferredActivities, setPreferredActivities] = useState<string[]>([])
  const [bio, setBio] = useState('')

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age
  }

  // Get max date (18 years ago for age requirement)
  const getMaxDate = (): string => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 18)
    return date.toISOString().split('T')[0]
  }

  const toggleSelection = (
    item: string,
    selectedItems: string[],
    setSelectedItems: (items: string[]) => void
  ) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    // Validation
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

    if (preferredActivities.length === 0) {
      setError('Please select at least one preferred activity type')
      return
    }

    setIsLoading(true)

    const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'
    const userStr = localStorage.getItem('user')
    
    if (!DEV_MODE && !userStr) {
      setError('User session expired. Please log in again.')
      navigate('/login')
      return
    }

    // Get current user
    const currentUser = localAuth.getCurrentUser()
    if (!currentUser && !DEV_MODE) {
      setError('User session expired. Please log in again.')
      navigate('/login')
      return
    }

    const userId = currentUser?.id || (userStr ? JSON.parse(userStr).id : 1)
    const calculatedAge = calculateAge(dateOfBirth)

    const onboardingData: OnboardingRequest = {
      userId,
      dateOfBirth,
      languages: selectedLanguages,
      interests: selectedInterests,
      travelStyle: travelStyle || undefined,
      preferredActivityTypes: preferredActivities,
      bio: bio.trim() || undefined,
    }

    try {
      if (DEV_MODE) {
        // In dev mode, save to local storage
        localProfile.saveProfile({
          userId,
          dateOfBirth,
          age: calculatedAge,
          languages: selectedLanguages,
          interests: selectedInterests,
          travelStyle: travelStyle || undefined,
          preferredActivityTypes: preferredActivities,
          bio: bio.trim() || undefined,
        })
        console.log('✅ Profile saved to local storage:', onboardingData)
        navigate('/discover')
      } else {
        await onboardingApi.completeOnboarding(onboardingData)
        navigate('/discover')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to complete onboarding. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is authenticated (allow dev mode bypass)
  useEffect(() => {
    const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (!DEV_MODE && (!token || !user)) {
      navigate('/login')
    }
  }, [navigate])

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          animate={{ rotate: [0, 15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 md:py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-2xl"
        >
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="glow-card relative p-[1px]">
            <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-950/80 p-8">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-semibold text-white">
                  Tell us about yourself
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Help us match you with like-minded travelers
                </p>
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

              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
                      >
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
                      {age !== null && age >= 18 && (
                        <p className="mt-2 text-xs text-cyan-200">
                          Age: {age} years
                        </p>
                      )}
                      {age !== null && age < 18 && (
                        <p className="mt-2 text-xs text-red-300">
                          You must be at least 18 years old
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="languages"
                        className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"
                      >
                        <Globe className="h-4 w-4 text-cyan-300" />
                        Languages (select all that apply)
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {LANGUAGE_OPTIONS.map((language) => (
                          <motion.button
                            key={language}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                language,
                                selectedLanguages,
                                setSelectedLanguages
                              )
                            }
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
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Interests & Preferences */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                        <Heart className="h-4 w-4 text-cyan-300" />
                        Interests (select all that interest you)
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {INTEREST_OPTIONS.map((interest) => (
                          <motion.button
                            key={interest}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                interest,
                                selectedInterests,
                                setSelectedInterests
                              )
                            }
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
                        Preferred Activity Types
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {ACTIVITY_TYPE_OPTIONS.map((activity) => (
                          <motion.button
                            key={activity}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                activity,
                                preferredActivities,
                                setPreferredActivities
                              )
                            }
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

                {/* Step 3: Bio */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="bio"
                        className="mb-2 text-sm font-medium text-slate-200"
                      >
                        Bio (optional)
                      </label>
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
                      <p className="mt-1 text-xs text-slate-400">
                        {bio.length}/500 characters
                      </p>
                    </div>

                    <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">
                      <p className="font-medium text-cyan-200">
                        Review your selections:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Age: {age || 'Not set'}</li>
                        <li>• Languages: {selectedLanguages.length} selected</li>
                        <li>• Interests: {selectedInterests.length} selected</li>
                        {travelStyle && (
                          <li>
                            • Travel Style:{' '}
                            {
                              TRAVEL_STYLE_OPTIONS.find(
                                (s) => s.value === travelStyle
                              )?.label
                            }
                          </li>
                        )}
                        <li>• Preferred Activity Types: {preferredActivities.length} selected</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
                    whileTap={{ scale: currentStep === 1 ? 1 : 0.98 }}
                  >
                    Back
                  </motion.button>

                  {currentStep < totalSteps ? (
                    <motion.button
                      type="button"
                      onClick={() => {
                        // Validate step 2 before proceeding to step 3
                        if (currentStep === 2) {
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
                          setError('')
                        }
                        setCurrentStep(Math.min(totalSteps, currentStep + 1))
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
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      {isLoading ? 'Completing...' : 'Complete Profile'}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
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

