import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authApi, type RegisterRequest } from '../services/api'
import { localAuth } from '../services/localStorage'

type RegisterPageProps = {
  onSignup: (token: string) => void
  isAuthenticated: boolean
}

const RegisterPage = ({ onSignup, isAuthenticated }: RegisterPageProps) => {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only redirect if authenticated AND not in dev mode
    const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'
    if (isAuthenticated && !DEV_MODE) {
      navigate('/discover', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const userData: RegisterRequest = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password,
      confirmPassword,
    }

    try {
      const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'
      
      if (DEV_MODE) {
        // In dev mode, use local storage for registration
        const newUser = localAuth.register({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
        })
        
        // Automatically log in the new user
        const token = `local-token-${newUser.id}`
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify({
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }))
        
        onSignup(token)
        navigate('/onboarding')
      } else {
        const response = await authApi.register(userData)
        // After successful registration, login the user
        const loginResponse = await authApi.login({
          email: userData.email,
          password: userData.password,
        })
        localStorage.setItem('authToken', loginResponse.token)
        localStorage.setItem('user', JSON.stringify(loginResponse.user))
        onSignup(loginResponse.token)
        // Redirect to onboarding after successful registration
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 md:py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200/90"
            >
              <img
                src="/urbane-logo.png"
                alt="Urbane"
                className="h-10 w-10 rounded-full object-cover"
              />
              Urbane
            </Link>
          </div>

          <div className="glow-card relative p-[1px]">
            <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-950/80 p-8">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-semibold text-white">
                  Create your account
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Join our community of travelers and explorers
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

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="text-sm font-medium text-slate-200"
                    >
                      First name
                    </label>
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                      <input
                        id="firstName"
                        name="firstName"
                        required
                        placeholder="Amina"
                        className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="text-sm font-medium text-slate-200"
                    >
                      Last name
                    </label>
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                      <input
                        id="lastName"
                        name="lastName"
                        required
                        placeholder="Garcia"
                        className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-200"
                  >
                    Email address
                  </label>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@email.com"
                      className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-200"
                    >
                      Password
                    </label>
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-slate-200"
                    >
                      Confirm password
                    </label>
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-cyan-400 focus:ring-cyan-500"
                  />
                  <label htmlFor="terms">
                    I agree to the community guidelines and terms of service.
                  </label>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-cyan-200 hover:text-cyan-100"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage

