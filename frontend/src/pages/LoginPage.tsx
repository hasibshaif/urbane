import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authApi } from '../services/api'
import { localAuth } from '../services/localStorage'

type LoginPageProps = {
  onLogin: (token: string) => void
  isAuthenticated: boolean
}

const isDev = import.meta.env.DEV

const LoginPage = ({ onLogin, isAuthenticated }: LoginPageProps) => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !isDev) {
      navigate('/discover', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      if (isDev) {
        const user = localAuth.login(email, password)
        const token = `local-token-${user.id}`
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }))
        onLogin(token)
        navigate('/discover')
      } else {
        const res = await authApi.login({ email, password })
        localStorage.setItem('authToken', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        onLogin(res.token)
        navigate('/discover')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
          animate={{ y: [0, 25, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 md:py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 inline-flex items-center gap-3 text-sm font-semibold text-cyan-200/90">
            <img src="/images/logos/urbane-logo.png" alt="Urbane" className="h-24 w-24 object-contain" />
            Urbane
          </Link>

          <div className="glow-card relative p-[1px]">
            <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-950/80 p-8">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-semibold text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-300">Sign in to your account to continue</p>
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
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-200">Email address</label>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@email.com"
                      required
                      className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-slate-200">Password</label>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-400 focus:ring-cyan-500" />
                    Remember me
                  </label>
                  <button type="button" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-cyan-200 hover:text-cyan-100">Sign up</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage

