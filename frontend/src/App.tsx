import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerificationPage from './pages/VerificationPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'

function App() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('authToken'))

  const onLogin = (token: string) => {
    setIsAuth(true)
    localStorage.setItem('authToken', token)
  }

  const needsAuth = (page: boolean) => {
    return page ? isAuth : true
  }

  // Check if user has completed onboarding (has profile)
  const hasProfile = () => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return false
    try {
      const user = JSON.parse(userStr)
      // Check if profile extended data exists (indicates onboarding completed)
      const profileExtended = localStorage.getItem(`profile_extended_${user.id}`)
      return !!profileExtended
    } catch {
      return false
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/login"
        element={<LoginPage onLogin={onLogin} isAuthenticated={isAuth} />}
      />
      <Route
        path="/signup"
        element={<RegisterPage onSignup={onLogin} isAuthenticated={isAuth} />}
      />
      <Route
        path="/verify"
        element={<VerificationPage />}
      />
      <Route
        path="/onboarding"
        element={
          needsAuth(true) ? (
            <OnboardingPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/home"
        element={
          needsAuth(true) ? (
            <HomePage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/discover"
        element={
          needsAuth(true) ? (
            hasProfile() ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

)
}

export default App
