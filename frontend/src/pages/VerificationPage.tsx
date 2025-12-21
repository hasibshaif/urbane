import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'

type VerificationPageProps = {
  onVerificationComplete?: () => void
}

const VerificationPage = ({ onVerificationComplete }: VerificationPageProps) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/signup')
    }
  }, [email, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/auth/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          confirmationCode: code,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Verification failed' }))
        throw new Error(errorData.error || 'Invalid verification code')
      }

      // Verification successful - navigate to login
      if (onVerificationComplete) {
        onVerificationComplete()
      }
      navigate('/login?verified=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setResending(true)

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resend code' }))
        throw new Error(errorData.error || 'Failed to resend verification code')
      }

      // Show success message
      setError('Verification code resent! Please check your email.')
      setTimeout(() => setError(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

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
                <div className="mb-4 flex items-center justify-center">
                  <div className="rounded-full bg-cyan-400/20 p-4">
                    <Mail className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>
                <h2 className="font-display text-3xl font-semibold text-white text-center">Verify your email</h2>
                <p className="mt-2 text-sm text-slate-300 text-center">
                  We've sent a verification code to <span className="font-medium text-cyan-200">{email}</span>
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                    error.includes('resent') || error.includes('success')
                      ? 'border-green-500/30 bg-green-500/10 text-green-200'
                      : 'border-red-500/30 bg-red-500/10 text-red-200'
                  }`}
                >
                  {error}
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="code" className="text-sm font-medium text-slate-200">
                    Verification Code
                  </label>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full border-none bg-transparent text-center text-2xl font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: loading || code.length !== 6 ? 1 : 1.01 }}
                  whileTap={{ scale: loading || code.length !== 6 ? 1 : 0.99 }}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-sm font-medium text-cyan-200 hover:text-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : "Didn't receive a code? Resend"}
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-slate-400">
                Already verified?{' '}
                <Link to="/login" className="font-medium text-cyan-200 hover:text-cyan-100">
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

export default VerificationPage

